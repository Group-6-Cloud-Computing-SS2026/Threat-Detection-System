import React from "react";
import type { TagUrl } from "../../../types";

type FooterListProps = {
    urls: TagUrl[];
};

const FooterList: React.FC<FooterListProps> = ({ urls }) => {
    return (
        <ul className="space-y-2 text-sm">
            {urls.map((url, index) => (
                <li key={index}>
                    <a
                        className="text-brand-light-green-200/65 hover:text-brand-light-green-500 transition"
                        href={url.url.href}
                    >
                        {url.tag}
                    </a>
                </li>
            ))}
        </ul>
    );
};

export default FooterList;
