import { empty, Observable } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { State } from '../components/app';

function extractSinks<Si>(
    sinks$: Observable<Si>,
    driverNames: string[]
): { [k in keyof Si]-?: Si[k] } {
    function get(s: any, d: string): Observable<State> {
        return s[d];
    }

    return driverNames
        .map(d => ({
            [d]: sinks$.pipe(
                switchMap(s => {
                    const ob$ = get(s, d);
                    return ob$ !== undefined
                        ? ob$.pipe(filter(b => !!b))
                        : empty();
                }),
                filter(val => !!val)
            )
        }))
        .reduce((acc, curr) => Object.assign(acc, curr), {}) as any;
}

export { extractSinks };
