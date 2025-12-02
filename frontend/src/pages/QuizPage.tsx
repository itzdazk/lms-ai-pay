import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
  Home,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { getQuizById, calculateQuizScore, getQuizAttempts, currentUser } from '../lib/mockData';
import { toast } from 'sonner';

type QuizState = 'start' | 'taking' | 'results';

export function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const quiz = getQuizById(id || '');
  const [state, setState] = useState<QuizState>('start');
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    if (quiz && state === 'taking' && quiz.time_limit_minutes) {
      setTimeLeft(quiz.time_limit_minutes * 60);
    }
  }, [quiz, state]);

  useEffect(() => {
    if (state === 'taking' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [state, timeLeft]);

  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-20 text-center bg-background min-h-screen">
        <h1 className="text-3xl mb-4 text-white">Không tìm thấy bài quiz</h1>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link to="/dashboard">Quay lại Dashboard</Link>
        </Button>
      </div>
    );
  }

  const attempts = getQuizAttempts(currentUser.id, quiz.id);
  const attemptsLeft = quiz.max_attempts - attempts.length;

  const handleStartQuiz = () => {
    if (attemptsLeft <= 0) {
      toast.error('Bạn đã hết lượt làm bài');
      return;
    }
    setAnswers(new Array(quiz.questions.length).fill(-1));
    setCurrentQuestion(0);
    setState('taking');
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmitQuiz = () => {
    const finalScore = calculateQuizScore(quiz, answers);
    setScore(finalScore);
    setPassed(finalScore >= quiz.passing_score);
    setState('results');
    
    if (finalScore >= quiz.passing_score) {
      toast.success('Chúc mừng! Bạn đã vượt qua bài quiz! 🎉');
    } else {
      toast.error('Bạn chưa đạt điểm tối thiểu. Hãy thử lại!');
    }
  };

  const handleRetry = () => {
    if (attemptsLeft <= 1) {
      toast.error('Bạn đã hết lượt làm bài');
      return;
    }
    setState('start');
    setAnswers([]);
    setCurrentQuestion(0);
    setScore(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Screen
  if (state === 'start') {
    return (
      <div className="min-h-screen bg-background pt-4 pb-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <Card className="mb-4 bg-[#1A1A1A] border-[#2D2D2D] rounded-xl">
            <CardContent className="px-4 py-3.5">
              <Button
                variant="outline"
                className="w-full !bg-black border-2 border-[#2D2D2D] !rounded-lg hover:!bg-gray-800 !text-white"
                asChild
              >
                <Link to={`/learn/${quiz.course_id}`}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Quay lại khóa học
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20">
                <Trophy className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-white">{quiz.title}</CardTitle>
              <CardDescription className="text-gray-400">{quiz.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Quiz Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-[#1F1F1F] rounded-lg">
                  <span className="text-gray-400">Số câu hỏi</span>
                  <Badge variant="outline" className="text-lg border-[#2D2D2D] text-gray-300">
                    {quiz.questions.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#1F1F1F] rounded-lg">
                  <span className="text-gray-400">Thời gian</span>
                  <Badge variant="outline" className="text-lg border-[#2D2D2D] text-gray-300">
                    {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} phút` : 'Không giới hạn'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#1F1F1F] rounded-lg">
                  <span className="text-gray-400">Điểm đạt</span>
                  <Badge variant="outline" className="text-lg border-[#2D2D2D] text-gray-300">
                    {quiz.passing_score}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#1F1F1F] rounded-lg">
                  <span className="text-gray-400">Số lần làm</span>
                  <Badge variant="outline" className="text-lg border-[#2D2D2D] text-gray-300">
                    {attemptsLeft}/{quiz.max_attempts}
                  </Badge>
                </div>
              </div>

              {/* Previous Attempts */}
              {attempts.length > 0 && (
                <div className="border-t border-[#2D2D2D] pt-6">
                  <h3 className="font-semibold mb-3 text-white">Lịch sử làm bài</h3>
                  <div className="space-y-2">
                    {attempts.map((attempt, index) => (
                      <div key={attempt.id} className="flex items-center justify-between p-3 bg-[#1F1F1F] rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant={attempt.passed ? 'default' : 'secondary'} className={attempt.passed ? 'bg-green-600' : 'bg-gray-600'}>
                            Lần {attempts.length - index}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {new Date(attempt.completed_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${attempt.passed ? 'text-green-500' : 'text-red-500'}`}>
                            {attempt.score}%
                          </span>
                          {attempt.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 bg-yellow-600/20 border border-yellow-600/50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-400 mb-1">Lưu ý</p>
                  <ul className="list-disc list-inside text-yellow-300 space-y-1">
                    <li>Đọc kỹ câu hỏi trước khi trả lời</li>
                    <li>Bạn chỉ có {quiz.max_attempts} lần làm bài</li>
                    {quiz.time_limit_minutes && <li>Thời gian làm bài có giới hạn</li>}
                    <li>Không thể quay lại sau khi submit</li>
                  </ul>
                </div>
              </div>

              <Button 
                size="lg" 
                variant="outline"
                className="w-full !bg-black hover:!bg-gray-900 border-[#2D2D2D] !text-white" 
                onClick={handleStartQuiz}
                disabled={attemptsLeft <= 0}
              >
                {attemptsLeft <= 0 ? 'Đã hết lượt làm bài' : 'Bắt đầu làm bài'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Taking Quiz
  if (state === 'taking') {
    const question = quiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

    return (
      <div className="min-h-screen bg-background pt-6 pb-8">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <Card className="mb-6 bg-[#1A1A1A] border-[#2D2D2D]">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Câu hỏi</p>
                  <p className="text-2xl text-white">
                    {currentQuestion + 1} / {quiz.questions.length}
                  </p>
                </div>
                {quiz.time_limit_minutes && (
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-1">Thời gian còn lại</p>
                    <div className={`text-2xl flex items-center gap-2 ${timeLeft < 60 ? 'text-red-500' : 'text-white'}`}>
                      <Clock className={`h-5 w-5 ${timeLeft < 60 ? 'text-red-500' : 'text-white'}`} />
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                )}
              </div>
              <Progress value={progress} />
            </CardContent>
          </Card>

          {/* Question */}
          <Card className="mb-4 bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-xl text-white">{question.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[currentQuestion]?.toString() || ''}
                onValueChange={(value) => handleAnswerSelect(currentQuestion, parseInt(value))}
              >
                <div className="space-y-3">
                            {question.options.map((option, index) => (
                              <div
                                key={index}
                                className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                  answers[currentQuestion] === index
                                    ? 'border-gray-300 bg-white'
                                    : 'border-[#2D2D2D] hover:border-[#4A4A4A] hover:bg-[#1F1F1F]'
                                }`}
                              >
                                <RadioGroupItem value={index.toString()} id={`q${currentQuestion}-opt${index}`} />
                                <Label
                                  htmlFor={`q${currentQuestion}-opt${index}`}
                                  className={`flex-1 cursor-pointer ${answers[currentQuestion] === index ? 'text-gray-900' : 'text-white'}`}
                                >
                                  {option}
                                </Label>
                              </div>
                            ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center ">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="bg-[#1A1A1A] border-2 border-[#2D2D2D] !rounded-lg !text-white hover:bg-[#2D2D2D] disabled:opacity-50 px-5 py-2.5 text-base"
              >
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                Câu trước
              </Button>
              <Button
                onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                disabled={currentQuestion === quiz.questions.length - 1}
                variant="outline"
                className="bg-[#1A1A1A] border-2 border-[#2D2D2D] !rounded-lg !text-white hover:bg-[#2D2D2D] disabled:opacity-50 px-5 py-2.5 text-base"
              >
                Câu tiếp theo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div>
              <Button
                onClick={handleSubmitQuiz}
                disabled={currentQuestion !== quiz.questions.length - 1 || answers.some(a => a === -1)}
                size="lg"
                variant="outline"
                className="bg-[#1A1A1A] border-2 border-[#2D2D2D] !rounded-lg !text-white hover:bg-[#2D2D2D] disabled:opacity-50 px-5 py-2.5 text-base"
              >
                Nộp bài
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Question Navigation */}
          <Card className="mt-4 bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-sm text-white">Danh sách câu hỏi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {quiz.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`aspect-square rounded-lg border-2 transition-colors ${
                      index === currentQuestion
                        ? 'border-blue-600 bg-blue-600/20 text-white'
                        : answers[index] !== -1
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-[#2D2D2D] hover:border-[#4A4A4A] text-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Results Screen
  return (
      <div className="min-h-screen bg-black pt-6 pb-8">
        <div className="container mx-auto px-4 max-w-5xl">
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="text-center">
            <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
              passed ? 'bg-green-600/20' : 'bg-red-600/20'
            }`}>
              {passed ? (
                <Trophy className="h-10 w-10 text-green-500" />
              ) : (
                <XCircle className="h-10 w-10 text-red-500" />
              )}
            </div>
            <CardTitle className="text-3xl mb-2 text-white">
              {passed ? 'Chúc mừng! 🎉' : 'Chưa đạt'}
            </CardTitle>
            <CardDescription className="text-lg text-gray-400">
              {passed 
                ? 'Bạn đã vượt qua bài quiz thành công!' 
                : `Bạn cần ${quiz.passing_score}% để đạt. Hãy thử lại!`
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Score */}
            <div className="text-center p-8 bg-[#1F1F1F] rounded-lg">
              <p className="text-gray-400 mb-2">Điểm của bạn</p>
              <p className={`text-6xl mb-2 ${passed ? 'text-green-500' : 'text-red-500'}`}>
                {score}%
              </p>
              <p className="text-gray-400">
                {quiz.questions.filter((q, i) => answers[i] === q.correct_answer).length}/{quiz.questions.length} câu đúng
              </p>
            </div>

            {/* Review Answers */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-white">Đáp án chi tiết</h3>
              {quiz.questions.map((question, qIndex) => {
                const isCorrect = answers[qIndex] === question.correct_answer;
                return (
                  <Card key={qIndex} className={`border-2 bg-[#1F1F1F] ${isCorrect ? 'border-green-500/50' : 'border-red-500/50'}`}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium mb-3 text-white">Câu {qIndex + 1}: {question.question}</p>
                          <div className="space-y-2 text-sm">
                            {question.options.map((option, optionIndex) => {
                              const isSelected = answers[qIndex] === optionIndex;
                              const isAnswer = question.correct_answer === optionIndex;
                              return (
                                <div
                                  key={optionIndex}
                                  className={`p-2 rounded border ${
                                    isAnswer
                                      ? 'border-green-500 bg-green-500/20'
                                      : isSelected
                                      ? 'border-red-500 bg-red-500/20'
                                      : 'border-[#2D2D2D]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={`font-medium ${isAnswer ? 'text-green-400' : isSelected ? 'text-red-400' : 'text-gray-300'}`}>
                                      {String.fromCharCode(65 + optionIndex)}. {option}
                                    </span>
                                    {isAnswer && (
                                      <div className="flex-1 text-right">
                                        <Badge className="bg-green-600 text-white">Đáp án</Badge>
                                      </div>
                                    )}
                                    {!isAnswer && isSelected && <Badge className="bg-red-500 text-white">Bạn chọn</Badge>}
                                  </div>
                                </div>
                              );
                            })}
                            {question.explanation && (
                              <div className="p-2 rounded bg-blue-600/20 text-blue-300">
                                <span className="font-medium">Giải thích: </span>
                                {question.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {!passed && attemptsLeft > 1 && (
                <Button
                  variant="outline"
                  className="flex-1 !bg-gray-800 dark:!bg-black border-2 border-[#2D2D2D] !rounded-lg  !text-white"
                  onClick={handleRetry}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Làm lại ({attemptsLeft - 1} lượt còn lại)
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1 !bg-gray-800 dark:!bg-black border-2 border-[#2D2D2D] !rounded-lg !text-white"
                asChild
              >
                <Link to={`/learn/${quiz.course_id}`}>
                  <Home className="h-4 w-4 mr-2" />
                  Quay lại khóa học
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
