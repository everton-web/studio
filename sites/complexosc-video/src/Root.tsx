import {Composition} from 'remotion';
import {Video} from './Video';
import {DURACAO, FPS} from './tempo';

export const Root: React.FC = () => (
  <>
    <Composition id="Vertical" component={Video} durationInFrames={DURACAO} fps={FPS} width={1080} height={1920} defaultProps={{o: 'v' as const}} />
    <Composition id="Horizontal" component={Video} durationInFrames={DURACAO} fps={FPS} width={1920} height={1080} defaultProps={{o: 'h' as const}} />
  </>
);
