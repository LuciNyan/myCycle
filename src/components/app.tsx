import isolate from '@cycle/isolate';
import { Observable } from 'rxjs';
import { merge, mapTo, filter, map } from 'rxjs/operators';
import { extractSinks } from '../utils/index';

import { driverNames } from '../drivers';
import { Sources, Sinks, Component } from '../interfaces';
import { Counter, State as CounterState } from './Counter';
import { Speaker, State as SpeakerState } from './Speaker';
import { Metronome, State as MetronomeState } from './Metronome';

export interface State {
    counter?: CounterState;
    speaker?: SpeakerState;
    metronome?: MetronomeState;
}

export function App(sources: Sources<State>): Sinks<State> {
    const match$ = sources.router.define({
        '/counter': isolate(Counter, 'counter'),
        '/speaker': isolate(Speaker, 'speaker'),
        '/metronome': isolate(Metronome, 'metronome')
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
        mapTo('/metronome')
    );

    const sinks = extractSinks(componentSinks$, driverNames);

    return {
        ...sinks,
        router: redirect$.pipe(merge(sinks.router))
    };
}
