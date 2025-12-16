import { PropsWithChildren, ReactNode } from "react";

type TableProps = {
  headers: string[];
  footer?: ReactNode;
};

export function Table({ headers, children, footer }: PropsWithChildren<TableProps>) {
  return (
    <div className="overflow-x-auto overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-3 py-2 font-medium sm:px-4 sm:py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-800">{children}</tbody>
        {footer && (
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={headers.length} className="px-3 py-2 text-right text-gray-500 sm:px-4 sm:py-3">
                {footer}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

type TableCell = {
  key?: string;
  content: ReactNode;
};

type TableRowProps = {
  cells: Array<TableCell>;
};

export function TableRow({ cells }: TableRowProps) {
  return (
    <tr className="hover:bg-gray-50">
      {cells.map((cell, idx) => (
        <td key={cell.key ?? idx} className="px-3 py-2 align-top sm:px-4 sm:py-3">
          {cell.content}
        </td>
      ))}
    </tr>
  );
}

