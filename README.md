# IFBA Dashboard

O IFBA Dashboard foi um site criado inteiramente com Next.JS e Firebase para suprir uma demanda minha e de parte da minha turma do colégio no ensino médio enquanto as aulas eram online. Este projeto foi feito em aproximadamente 1 semana e foi utilizado TypeScript e Next Apis para acelerar o processo de desenvolvimento.

> → Você pode usar a chave de acesso: **`12345678`** para testar o site online [<https://ifba-dashboard.vercel.app/>](https://ifba-dashboard.vercel.app/)

![Exemplo de uso](resources/usage-example.gif)

## Rodando localmente

→ *Precisa ter o Node.JS na sua máquina*

Instale as dependências
```bash
npm install
```

Crie um arquivo chamado `.env` na raíz do projeto

```env
SECRET=SEGREDO DO TOKEN
API_KEY=OBTIDO NO FIREBASE
AUTH_DOMAIN=OBTIDO NO FIREBASE
DATABASE_URL=OBTIDO NO FIREBASE
PROJECT_ID=OBTIDO NO FIREBASE
STORAGE_BUCKET=OBTIDO NO FIREBASE
MESSAGING_SENDER_ID=OBTIDO NO FIREBASE
APP_ID=OBTIDO NO FIREBASE
MEASUREMENT_ID=OBTIDO NO FIREBASE
TOKEN_EXPIRES_TIME=TEMPO EM HORAS PARA O TOKEN EXPIRAR
```

Rode o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
```

Para rodar o site em modo de produção:

```bash
npm run build
# em seguida
npm run start
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.