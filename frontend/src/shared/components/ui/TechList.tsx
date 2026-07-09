import React from "react";
import type { TagUrl } from "../../types";

type TechListProps = {
  technologies: TagUrl[];
};

const TechList: React.FC<TechListProps> = ({ technologies }) => {
  return (
    <ul className="space-y-2 text-sm">
      {technologies.map((technology, index) => (
        <li key={index}>
          <a
            className="text-brand-light-green-200/65 hover:text-brand-light-green-500 transition"
            href={technology.url.href}
          >
            {technology.tag}
          </a>
        </li>
      ))}
    </ul>
  );
};

export default TechList;
