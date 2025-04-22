"use client";

import StandaloneResultTile, {StandaloneResultTileProps} from "@/components/standalone-result-tile";

export interface ResultListProps {
    /** Array von Objekten mit text und optional htmlUrl */
    items: StandaloneResultTileProps[];
}

export default function ResultList({ items }: ResultListProps) {
    return (
        <div className="space-y-2">
            {items.map((item, index) => (
                <StandaloneResultTile key={index} {...item} />
            ))}
        </div>
    );
}
