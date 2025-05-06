import Head from 'next/head';

export default function Layout({ children, title = 'The Smith Agency Portal' }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="The Smith Agency Portal for clients and staff" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow">{children}</main>
      </div>
    </>
  );
} 