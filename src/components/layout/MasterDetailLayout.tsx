import type { ReactNode } from "react";

type Props = {
  title: string;
  left: ReactNode;
  right: ReactNode;
};

export function MasterDetailLayout({ title, left, right }: Props) {
  return (
    <>
      <div className="page-header">
        <h2>{title}</h2>
      </div>

      <div className="master-detail">
        <div className="left-panel">{left}</div>
        <div className="right-panel">{right}</div>
      </div>
    </>
  );
}
