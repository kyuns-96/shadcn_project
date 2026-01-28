import { useAppDispatch, useAppSelector } from '@/store';
import { addGraphWindow, selectGraphWindowCount } from '@/store/reducers/graphSlice';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChartColumn } from 'lucide-react';

export function GraphFAB() {
  const dispatch = useAppDispatch();
  const windowCount = useAppSelector(selectGraphWindowCount);
  const isMaxReached = windowCount >= 10;

  const handleClick = () => {
    if (!isMaxReached) {
      dispatch(addGraphWindow());
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="fixed bottom-6 right-6 z-50">
          <Button
            className="relative h-14 w-14 rounded-full shadow-lg"
            onClick={handleClick}
            disabled={isMaxReached}
            aria-disabled={isMaxReached}
            data-testid="graph-fab"
          >
            <ChartColumn className="h-6 w-6" />
            {windowCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-5 w-5 text-xs flex items-center justify-center">
                {windowCount}
              </span>
            )}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {isMaxReached ? 'Maximum 10 windows' : 'Add Graph'}
      </TooltipContent>
    </Tooltip>
  );
}
