-- Migrazione una tantum per un database Study Hub esistente.
-- Eseguire prima un backup e provare su Supabase di sviluppo.
-- Gli account Auth ricevono il ruolo standard. Dopo l'esecuzione, dal SQL Editor
-- assegnare il ruolo admin al profilo con l'UUID del proprietario verificato:
-- UPDATE public.study_profiles SET role = 'admin' WHERE user_id = '<UUID Auth>';
-- Collegare il sito al database migrato dopo aver aggiunto il login.
-- Rieseguire gli script legacy allow_*.sql o add_exam_settings.sql dopo questa
-- migrazione può riaprire gli accessi. Usarli solo per preparare lo schema di partenza.

BEGIN;

CREATE SCHEMA study_private;
REVOKE ALL ON SCHEMA study_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA study_private TO authenticated;

CREATE TABLE public.study_profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    role text NOT NULL DEFAULT 'standard' CHECK (role IN ('admin', 'standard'))
);

CREATE TABLE public.study_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE CHECK (btrim(name) <> '')
);

CREATE TABLE public.study_deck_categories (
    deck_id uuid NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.study_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (deck_id, category_id)
);

CREATE TABLE public.study_deck_assignments (
    user_id uuid NOT NULL REFERENCES public.study_profiles(user_id) ON DELETE CASCADE,
    deck_id uuid NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, deck_id)
);

CREATE TABLE public.study_category_assignments (
    user_id uuid NOT NULL REFERENCES public.study_profiles(user_id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.study_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, category_id)
);

CREATE INDEX study_deck_categories_category_idx ON public.study_deck_categories(category_id);
CREATE INDEX study_deck_assignments_deck_idx ON public.study_deck_assignments(deck_id);
CREATE INDEX study_category_assignments_category_idx ON public.study_category_assignments(category_id);

CREATE FUNCTION study_private.create_profile()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.study_profiles (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION study_private.create_profile() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER study_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION study_private.create_profile();

INSERT INTO public.study_profiles (user_id)
SELECT id FROM auth.users;

CREATE FUNCTION study_private.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT FROM public.study_profiles AS profile
        WHERE profile.user_id = (SELECT auth.uid()) AND profile.role = 'admin'
    );
$$;

CREATE FUNCTION study_private.can_access_deck(target_deck_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
    SELECT study_private.is_admin()
        OR EXISTS (
            SELECT FROM public.study_deck_assignments AS assignment
            WHERE assignment.user_id = (SELECT auth.uid())
                AND assignment.deck_id = target_deck_id
        )
        OR EXISTS (
            SELECT FROM public.study_deck_categories AS membership
            JOIN public.study_category_assignments AS assignment USING (category_id)
            WHERE assignment.user_id = (SELECT auth.uid())
                AND membership.deck_id = target_deck_id
        );
$$;

REVOKE ALL ON FUNCTION study_private.is_admin(), study_private.can_access_deck(uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION study_private.is_admin(), study_private.can_access_deck(uuid)
TO authenticated;

-- Le policy permissive si combinano con OR. Sostituisci quelle precedenti sulle
-- sole tabelle applicative elencate, compresi eventuali nomi diversi da quelli del repo.
DO $$
DECLARE
    table_name text;
    old_policy record;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'courses', 'decks', 'questions', 'answers', 'exam_settings', 'quiz_results',
        'study_categories', 'study_deck_categories', 'study_deck_assignments',
        'study_category_assignments', 'study_profiles'
    ]
    LOOP
        FOR old_policy IN
            SELECT policyname FROM pg_catalog.pg_policies
            WHERE schemaname = 'public' AND tablename = table_name
        LOOP
            EXECUTE format('DROP POLICY %I ON public.%I', old_policy.policyname, table_name);
        END LOOP;

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', table_name);
        IF table_name = 'study_profiles' THEN
            EXECUTE 'GRANT SELECT ON public.study_profiles TO authenticated';
        ELSE
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
            EXECUTE format(
                'CREATE POLICY study_admin ON public.%I TO authenticated
                 USING ((SELECT study_private.is_admin()))
                 WITH CHECK ((SELECT study_private.is_admin()))', table_name
            );
        END IF;
    END LOOP;
END;
$$;

CREATE POLICY study_profiles_read ON public.study_profiles FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR (SELECT study_private.is_admin()));

CREATE POLICY study_courses_read ON public.courses FOR SELECT TO authenticated
USING (EXISTS (SELECT FROM public.decks WHERE decks.course_id = courses.id));

CREATE POLICY study_decks_read ON public.decks FOR SELECT TO authenticated
USING (study_private.can_access_deck(id));

CREATE POLICY study_questions_read ON public.questions FOR SELECT TO authenticated
USING (study_private.can_access_deck(deck_id));

CREATE POLICY study_answers_read ON public.answers FOR SELECT TO authenticated
USING (EXISTS (SELECT FROM public.questions WHERE questions.id = answers.question_id));

CREATE POLICY study_exam_settings_read ON public.exam_settings FOR SELECT TO authenticated
USING (EXISTS (
    SELECT FROM public.decks
    WHERE decks.id = exam_settings.deck_id AND decks.course_id = exam_settings.course_id
));

CREATE POLICY study_categories_read ON public.study_categories FOR SELECT TO authenticated
USING (
    EXISTS (SELECT FROM public.study_deck_categories WHERE category_id = study_categories.id)
    OR EXISTS (SELECT FROM public.study_category_assignments WHERE category_id = study_categories.id)
);

CREATE POLICY study_memberships_read ON public.study_deck_categories FOR SELECT TO authenticated
USING (study_private.can_access_deck(deck_id));

CREATE POLICY study_deck_assignments_read ON public.study_deck_assignments FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY study_category_assignments_read ON public.study_category_assignments FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Le funzioni già installate devono applicare le stesse policy delle tabelle.
DO $$
DECLARE
    signature text;
    existing_function regprocedure;
BEGIN
    FOREACH signature IN ARRAY ARRAY[
        'public.rename_study_course(uuid,text,text)',
        'public.rename_study_deck(uuid,text,text)',
        'public.delete_study_course(uuid,text)',
        'public.delete_study_deck(uuid,text)'
    ]
    LOOP
        existing_function := to_regprocedure(signature);
        IF existing_function IS NOT NULL THEN
            EXECUTE format('ALTER FUNCTION %s SECURITY INVOKER', existing_function);
            EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', existing_function);
            EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', existing_function);
        END IF;
    END LOOP;
END;
$$;

WITH initial_category AS (
    INSERT INTO public.study_categories (name) VALUES ('Da classificare')
    RETURNING id
)
INSERT INTO public.study_deck_categories (deck_id, category_id)
SELECT decks.id, initial_category.id FROM public.decks CROSS JOIN initial_category;

COMMIT;
