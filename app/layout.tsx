import './globals.css'; import type { Metadata } from 'next';
export const metadata: Metadata={title:'Lumen — dein Denkraum',description:'Quellenbasiertes Arbeiten in einem ruhigen Workspace.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="de"><body>{children}</body></html>}
