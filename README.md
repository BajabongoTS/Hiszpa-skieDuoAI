```markdown
# 📚 Aplikacja Edukacyjna: Hiszpański z AI

**Interaktywna nauka hiszpańskiego** z wykorzystaniem AI, stylizowana na Duolingo z dodatkiem kalendarza w formie to-do listy. Aplikacja śledzi postępy użytkownika i dostosowuje poziom rozmowy z AI na podstawie ukończonych rozdziałów.

## ✨ Funkcje

- **📖 Nauka z podziałem na rozdziały (API)**  
  Na początek: 3 rozdziały z materiałem językowym.

- **🧠 AI Chat (Integracja z AI Chat)**  
  Rozmowy prowadzone są przez AI, dopasowane do poziomu użytkownika.  
  Przykład: jeśli użytkownik jest na poziomie 2, AI zadaje pytania i odpowiada w oparciu o rozdział 3.

- **🗓️ Kalendarz Hiszpański (API)**  
  Kalendarz w formie to-do listy z zadaniami językowymi do wykonania każdego dnia.

---

## 📁 Struktura Projektu

```

/backend
└── api/
├── chapters/
│   └── \[GET] /chapters
│   └── \[GET] /chapters/\:id
└── calendar/
└── \[GET] /calendar/today
/frontend
└── components/
├── ChatAI.js
├── Calendar.js
└── ChapterView\.js

```

---

## 🚀 Plan działania

1. **Stworzyć API z 3 rozdziałami**
    - Endpointy: `/chapters`, `/chapters/:id`

2. **Podłączyć czat AI**
    - Możliwość: Chat z FreeCodeCamp lub inne API LLM (np. OpenAI, Cohere)
    - Dostosowanie odpowiedzi wg poziomu użytkownika (logika + prompt engineering)

3. **Zbudować API kalendarza**
    - Zadania dzienne jako to-do lista: `/calendar/today`

4. **Zaprogramować mechanizm poziomów**
    - Poziom użytkownika wpływa na zakres materiału i interakcję z AI

---

## 🛠️ Technologie

- **Frontend:** React / Next.js / Vite
- **Backend:** Node.js + Express
- **AI Chat:** (np. OpenAI API, Chatbot z FreeCodeCamp)
- **Baza danych:** PostgreSQL / MongoDB
- **Hosting:** Vercel / Render / Railway

---

## 🧪 Przykład działania AI

> **Użytkownik na poziomie 2:**  
> **AI:** _¿Qué hiciste ayer?_  
> **Użytkownik:** _Fui al mercado._  
> **AI:** _¡Muy bien! ¿Qué compraste?_

---

## 📌 Przyszłe funkcje

- System punktów / motywatorów jak w Duolingo
- Powiadomienia push do codziennego powtórzenia
- Personalizowany plan nauki

---

## 📬 Kontakt

Masz pytania, sugestie lub chcesz dołączyć do projektu?  
📧 [Twój e-mail lub GitHub]

```
