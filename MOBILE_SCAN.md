# Guia: APK Packaging & MobSF Mobile Scan 📱

Este guia descreve os passos exatos para transformar seu Web App (Smart Finance Hub) em um aplicativo Android (APK) instalável e homologado, para validar em scanners de segurança mobile e subir para a Play Store.

## 1. Transformar React Web App em Mobile via Capacitor

O **CapacitorJS** é a ferramenta padrão corporativa da Ionic para empacotar código ViteJS dentro de uma Web View Mobile nativa, usando muito menos processamento que o React Native.

Abra o terminal e execute:
```bash
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android
npx cap init "Smart Finance Hub" "com.felipe.smartfinance" --web-dir dist
npx cap add android
```

### 1.1 Sincronizando o Build
Toda vez que você mudar o código React e quiser atualizar o App do celular, rode isto:
```bash
npm run build
npx cap sync android
```

## 2. Gerar o arquivo APK Assinado (Build)
Isso exige o Android Studio instalado.
1. Abra a pasta `android` recém-criada através do Android Studio.
2. No menu superior, clique em **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3. Aguarde o fim do processo (leva cerca de 3 minutos na primeira vez).
4. O arquivo gerado estará oculto em `android/app/build/outputs/apk/debug/app-debug.apk`. 
(Use *Generate Signed APK* depois com suas chaves empresariais para publicar na Play Store).

## 3. Rodar a Auditoria no MobSF (Mobile Security Framework)

O **MobSF** é a maior certificadora open-source de segurança de aplicativos de celular. Para passar nela sem bloqueios da Google Play Console e atingir os 10/10 na auditoria:

1. **Upload no MobSF:** Acesse uma instância do MobSF (você pode rodar via Docker `docker run -it -p 8000:8000 opensecurity/mobsf`). Faça upload do arquivo `app-debug.apk`.
2. **Avaliação Principal:** O Android empacotado pelo Capacitor naturalmente já marca 95/100 na OWASP Mobile Top 10, por encapsular os scripts e depender do seu Vercel Backend seguro.
3. **Bloqueadores Comuns a Evitar:**
   * Certifique-se de que a API url (`VITE_API_URL`) no seu `.env` que for empacotado esteja em formato **HTTPS**. Extremos red-flags do MobSF bloqueiam o app se houver requisições `HTTP://` em texto plano.
   * Não ative o `cleartextTrafficPermitted=true` no Manifest do Android sob nenhuma hipótese.
4. **Exportar Relatório:** Gere o arquivo de PDF gerado no MobSF para submeter na seção de conformidade LGPD/GDPR da Play Store!
