-- Abilita le operazioni di Study Hub sul progetto Supabase di sviluppo.
-- Il sito attuale usa il ruolo anon per modificare la raccolta condivisa.
-- Queste funzioni espongono solo le tre operazioni richieste, una riga per chiamata.

BEGIN;

CREATE OR REPLACE FUNCTION public.rename_study_course(target_id uuid, expected_name text, new_name text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    UPDATE public.courses
    SET name = btrim(new_name)
    WHERE id = target_id AND name = expected_name AND nullif(btrim(new_name), '') IS NOT NULL;
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.rename_study_deck(target_id uuid, expected_name text, new_name text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    UPDATE public.decks
    SET name = btrim(new_name)
    WHERE id = target_id AND name = expected_name AND nullif(btrim(new_name), '') IS NOT NULL;
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_study_course(target_id uuid, expected_name text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    DELETE FROM public.courses WHERE id = target_id AND name = expected_name;
    RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rename_study_course(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rename_study_deck(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_study_course(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rename_study_course(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rename_study_deck(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_study_course(uuid, text) TO anon, authenticated;

COMMIT;
