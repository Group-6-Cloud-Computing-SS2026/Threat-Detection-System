import React from "react";
import type { TagUrl } from "../../types";

type TeamListProps = {
  members: TagUrl[];
};

const TeamList: React.FC<TeamListProps> = ({ members }) => {
  return (
    <ul className="space-y-2 text-sm">
      {members.map((member, index) => (
        <li key={index}>
          <a
            className="text-brand-light-green-200/65 hover:text-brand-light-green-500 transition"
            href={member.url.href}
          >
            {member.tag}
          </a>
        </li>
      ))}
    </ul>
  );
};

export default TeamList;
