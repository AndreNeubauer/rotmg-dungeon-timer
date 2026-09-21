# Daily Question

Super simple daily journal app.

- One question per day
- Cycles through every line in `questions.txt`
- Saves answers to `answers.txt`
- No database, no npm, no framework

## Run locally

```bash
python3 server.py
```

Then open [http://localhost:8080](http://localhost:8080).

## Files

| File | Purpose |
|------|---------|
| `questions.txt` | Question bank |
| `answers.txt` | Saved answers (created automatically) |
| `server.py` | Web server |
| `public/index.html` | Frontend |
| `HOSTING.md` | Cheap VM + URL setup |

## How the daily question is picked

The app uses today's date and rotates through `questions.txt`:

`question_index = days_since_2020_01_01 % number_of_questions`

Everyone sees the same question on the same day.
