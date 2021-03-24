import { AccountProvider } from "../contexts/accountContext";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <AccountProvider>
      <Component {...pageProps} />
    </AccountProvider>
  );
}

export default MyApp;
