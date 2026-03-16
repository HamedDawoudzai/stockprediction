import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="HD Investments - Your trusted platform for stock trading and portfolio management" />
        <meta name="keywords" content="stocks, investing, portfolio, trading, finance" />
        <meta name="author" content="HD Investments" />
        <meta name="theme-color" content="#39d39f" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
