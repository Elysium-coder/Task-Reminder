import '../styles/globals.css';
import { AuthProvider } from 'components/AuthProvider';
import Layout from 'components/Layout';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider initialUser={pageProps.initialUser ?? null}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
