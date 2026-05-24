import React from 'react';
import CardGrid from './CardGrid';
import ClassCard from './ClassCard';

export default function ClassesGrid({ dndClasses }) {
  return (
    <CardGrid
      variant="classes"
      items={dndClasses}
      emptyMessage="Ничего не найдено. Попробуйте другой запрос."
      renderItem={(dndClass) => <ClassCard key={dndClass.id} dndClass={dndClass} />}
    />
  );
}
