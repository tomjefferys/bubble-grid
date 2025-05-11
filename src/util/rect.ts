// Some simple utilities for working with 2d arrays

type Rect<V> = V[][];

export const createRect = <V>(items : V[], cols: number): Rect<V> => {
    const rows : Rect<V> = [];
    let row : V[] = [];
    rows.push(row);
    items.forEach((item, index) => {
        if (row.length >= cols) {
            row = [];
            rows.push(row);
        }
        row.push(item);
    });
    return rows;
}