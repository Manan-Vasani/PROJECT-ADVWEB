import React from 'react';
import { Header } from '../components/Header';
import { About } from '../components/About';
import { Skills } from '../components/Skills';

interface HomeProps {
  studentData: any;
}

export const Home: React.FC<HomeProps> = ({ studentData }) => {
  return (
    <>
      <Header 
        name={studentData.personal.name}
        title={studentData.personal.title}
        tagline={studentData.personal.tagline}
        themeColor="var(--color-primary)"
      />
      <About 
        bio={studentData.about.bio}
        education={studentData.about.education}
        interests={studentData.about.interests}
      />
      <Skills 
        skills={studentData.skills}
      />
    </>
  );
};
