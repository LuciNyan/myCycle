import isolate from '@cycle/isolate';
import { Observable, empty } from 'rxjs';
import { merge, mapTo, filter, map, switchMap, tap } from 'rxjs/operators';

import { driverNames } from '../drivers';
import { Sources, Sinks, Component } from '../interfaces';
import { Counter, State as CounterState } from './counter';
import { Speaker, State as SpeakerState } from './speaker';

export interface State {
    counter?: CounterState;
    speaker?: SpeakerState;
}

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

export function App(sources: Sources<State>): Sinks<State> {
    const match$ = sources.router.define({
        '/counter': isolate(Counter, 'counter'),
        '/speaker': isolate(Speaker, 'speaker')
    });

    const componentSinks$: Observable<Sinks<State>> = match$.pipe(
        filter(({ path, value }: any) => path && typeof value === 'function'),
        map(({ path, value }: { path: string; value: Component<any> }) => {
            return value({
                ...sources,
                router: sources.router.path(path)
            });
        })
    );

    const redirect$: Observable<string> = sources.router.history$.pipe(
        filter((l: Location) => l.pathname === '/'),
        mapTo('/counter')
    );

    const sinks = extractSinks(componentSinks$, driverNames);

    return {
        ...sinks,
        router: redirect$.pipe(merge(sinks.router))
    };
}
