import { AccountProvider } from "../contexts/AccountContext";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <AccountProvider>
      <Component {...pageProps} />
      <span
        style={{
          position: "fixed",
          bottom: "0",
          right: "0",
          padding: "0.5rem 1rem",
          backgroundColor: "white",
          borderTopLeftRadius: "5px",
          fontFamily: "monospace",
          fontWeight: "bold",
          fontSize: "1.1rem",
        }}
      >
        v1.1
      </span>
    </AccountProvider>
  );
}

export default MyApp;
