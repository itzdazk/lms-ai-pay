import { memo } from 'react';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

function ProgressStepsComponent({ steps, currentStep, onStepClick, className = '' }: ProgressStepsProps) {
  return (
    <div className={`w-full bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg p-6 ${className}`}>
      <div className="flex items-start relative">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const canClick = !!onStepClick; // Allow clicking on all steps if onStepClick is provided

          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative">
              {/* Connector Line - Above circles */}
              {index < steps.length - 1 && (
                <div className={`
                  absolute top-5 left-1/2 w-full h-1 -translate-y-1/2 transition-colors duration-300 z-0
                  ${isCompleted ? 'bg-blue-500' : 'bg-[#404040]'}
                `} 
                style={{ 
                  left: '50%',
                  width: 'calc(100% - 40px)',
                  marginLeft: '20px'
                }} />
              )}

              {/* Step Circle */}
              <div
                className={`
                  relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                  ${isCompleted
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : isCurrent
                    ? 'border-blue-500 text-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                    : 'border-[#404040] text-[#9CA3AF]'
                  }
                  ${canClick ? 'cursor-pointer hover:scale-105 hover:border-blue-500/50 hover:bg-[#2A2A2A]' : ''}
                `}
                onClick={() => canClick && onStepClick(index)}
              >
                <span className="text-sm font-bold">{index + 1}</span>
              </div>

              {/* Step Info - Below Circle */}
              <div className="mt-3 text-center min-w-0 px-2">
                <div className={`
                  text-sm font-semibold transition-colors duration-200
                  ${isCompleted || isCurrent
                    ? 'text-blue-400'
                    : 'text-[#9CA3AF]'
                  }
                  ${canClick ? 'hover:text-blue-300 cursor-pointer' : ''}
                `}
                onClick={() => canClick && onStepClick(index)}
                >
                  {step.title}
                </div>
                {step.description && (
                  <div className={`
                    text-xs mt-1 transition-colors duration-200
                    ${isCompleted || isCurrent ? 'text-[#D1D5DB]' : 'text-[#6B7280]'}
                  `}>
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ProgressSteps = memo(ProgressStepsComponent);
