# vercel-node-api-template

Minimalny działający template Node.js API na Vercel.

## Struktura

```txt
api/health.js      # GET /api/health
api/contact.js     # GET/POST/OPTIONS /api/contact z CORS
public/index.html  # prosty frontend testowy
package.json
```

## Lokalnie

```bash
npm install
npm run dev
```

Wejdź na:

```txt
http://localhost:3000
http://localhost:3000/api/health
http://localhost:3000/api/contact
```

## Deploy

```bash
npm run deploy
```

Albo wrzuć repo na GitHuba i zaimportuj w Vercel.

Ustawienia Vercel:

```txt
Framework Preset: Other
Build Command: puste
Output Directory: puste
Install Command: npm install
Root Directory: katalog tego projektu
```

## Ważne

Nie uruchamiaj tu `app.listen()` i nie wymagaj ręcznie `PORT` w kodzie aplikacji. Pliki w katalogu `api` są funkcjami serverless.
