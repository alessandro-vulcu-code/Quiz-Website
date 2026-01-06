# Multiple Choice Quiz App

Un'applicazione web per studiare con quiz a scelta multipla, con supporto per importazione domande, navigazione libera e modalità esame.

## 🚀 Funzionalità

- **Importazione Quiz**: Carica quiz da file .txt o .csv
- **Persistenza Dati**: I quiz importati vengono salvati in localStorage
- **Navigazione Libera**: Vai avanti e indietro tra le domande
- **Modalità Exam**: Genera quiz di 20 domande casuali da tutti i deck di un corso
- **Supporto LaTeX**: Rendering formule matematiche con MathJax
- **Supporto Markdown**: Grassetto con sintassi `**testo**`
- **Design Moderno**: Interfaccia elegante con animazioni smooth
- **Gestione Deck**: Elimina deck importati, organizza per corsi

## 📝 Formato File

### File .txt (semicolon-delimited)
```
Domanda;Risposta Corretta;Risposta Sbagliata 1;Risposta Sbagliata 2;Risposta Sbagliata 3;;1000
```
La prima risposta è sempre quella corretta.

### File .csv
```csv
question,answer1,answer2,answer3,answer4,correctIndex
"Domanda esempio","Risposta corretta","Sbagliata 1","Sbagliata 2","Sbagliata 3",0
```

## 🎯 Come Usare

1. **Importa Quiz**: Clicca su "📥 Importa Quiz" nella home
2. **Seleziona Corso**: Scegli un corso esistente o creane uno nuovo
3. **Carica File**: Seleziona un file .txt o .csv
4. **Studia**: Inizia il quiz e naviga liberamente tra le domande
5. **Exam Mode**: Usa la modalità esame per simulazioni realistiche

## 🛠️ Tecnologie

- HTML5
- CSS3 (con animazioni e gradients)
- JavaScript (Vanilla)
- MathJax (per formule LaTeX)
- localStorage API (per persistenza)

## 📦 File Principali

- `index.html` - Struttura dell'applicazione
- `style.css` - Stili e animazioni
- `app.js` - Logica principale dell'applicazione
- `parser.js` - Parsing file .txt e .csv
- `storage.js` - Gestione localStorage
- `data.js` - Struttura dati di base

## 🎨 Features

- ✅ Navigazione avanti/indietro tra domande
- ✅ Salvataggio automatico delle risposte
- ✅ Punteggio in tempo reale
- ✅ Feedback immediato su risposte corrette/errate
- ✅ Design responsivo
- ✅ Deck importati con badge distintivo
- ✅ Pulsante elimina per deck importati
- ✅ Modalità esame con 20 domande random

## 📄 Licenza

MIT License - Sentiti libero di usare e modificare questo progetto!

## 🤝 Contributi

Contributi, issues e feature requests sono benvenuti!

---

**Made with ❤️ for efficient studying**
