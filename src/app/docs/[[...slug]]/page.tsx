
'use server';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { notFound } from 'next/navigation';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { initializeAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

interface Doc {
  slug: string;
  title: string;
  content: string;
}

interface Category {
  categorySlug: string;
  categoryTitle: string;
  documents: Doc[];
}

const DOCS_COLLECTION = 'system';
const DOCS_DOCUMENT = 'docs';

// This function now reads from Firestore on the server
async function getDocsFromFirestore(): Promise<Category[]> {
  try {
    const db = getFirestore(initializeAdminApp());
    const docRef = db.collection(DOCS_COLLECTION).doc(DOCS_DOCUMENT);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return docSnap.data()?.content || [];
    }
    return [];
  } catch (error) {
    console.error("Could not read docs from Firestore", error);
    return [];
  }
}

async function getAllDocs(): Promise<Doc[]> {
  const docsData = await getDocsFromFirestore();
  if (!Array.isArray(docsData)) {
    return [];
  }
  return docsData.flatMap(category => 
    category.documents.map(doc => ({
      ...doc,
      // create a full slug for matching
      slug: `${category.categorySlug}/${doc.slug}`
    }))
  );
}

async function getDocBySlug(slug: string): Promise<Doc | undefined> {
  const allDocs = await getAllDocs();
  return allDocs.find(doc => doc.slug === slug);
}


export default async function DocPage({ params }: { params: { slug?: string[] }}) {
  const slug = params.slug?.join('/') || 'introduction/getting-started';
  const doc = await getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  return (
    <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:text-accent prose-a:text-accent hover:prose-a:text-accent/80 prose-strong:text-foreground prose-blockquote:border-accent prose-code:text-accent prose-code:before:content-[''] prose-code:after:content-[''] prose-code:bg-muted prose-code:px-1.5 prose-code:py-1 prose-code:rounded-md">
        <h1 className="font-headline text-4xl font-bold mb-4 text-accent">{doc.title}</h1>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{doc.content}</ReactMarkdown>
    </article>
  );
}

// This function generates static paths at build time
export async function generateStaticParams() {
  const allDocs = await getAllDocs();
  return allDocs.map(doc => ({
    slug: doc.slug.split('/'),
  }));
}
