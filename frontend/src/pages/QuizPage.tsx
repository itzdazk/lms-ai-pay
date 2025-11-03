import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import { getQuizById, calculateQuizScore, getQuizAttempts, currentUser, getCourseById } from '../lib/mockData';
import { toast } from 'sonner';

type QuizState = 'start' | 'taking' | 'results';

export function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl mb-4">Không tìm thấy bài quiz</h1>
        <Button asChild>
          <Link to="/dashboard">Quay lại Dashboard</Link>
        </Button>
      </div>
    );
  }

  const course = getCourseById(quiz.course_id);
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <Button variant="ghost" className="mb-6" asChild>
            <Link to={`/learn/${quiz.course_id}`}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Quay lại khóa học
            </Link>
          </Button>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Trophy className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">{quiz.title}</CardTitle>
              <CardDescription>{quiz.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Quiz Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Số câu hỏi</span>
                  <Badge variant="outline" className="text-lg">
                    {quiz.questions.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Thời gian</span>
                  <Badge variant="outline" className="text-lg">
                    {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} phút` : 'Không giới hạn'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Điểm đạt</span>
                  <Badge variant="outline" className="text-lg">
                    {quiz.passing_score}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Số lần làm</span>
                  <Badge variant="outline" className="text-lg">
                    {attemptsLeft}/{quiz.max_attempts}
                  </Badge>
                </div>
              </div>

              {/* Previous Attempts */}
              {attempts.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3">Lịch sử làm bài</h3>
                  <div className="space-y-2">
                    {attempts.map((attempt, index) => (
                      <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant={attempt.passed ? 'default' : 'secondary'}>
                            Lần {attempts.length - index}
                          </Badge>
                          <span className="text-sm">
                            {new Date(attempt.completed_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {attempt.score}%
                          </span>
                          {attempt.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-900 mb-1">Lưu ý</p>
                  <ul className="list-disc list-inside text-yellow-800 space-y-1">
                    <li>Đọc kỹ câu hỏi trước khi trả lời</li>
                    <li>Bạn chỉ có {quiz.max_attempts} lần làm bài</li>
                    {quiz.time_limit_minutes && <li>Thời gian làm bài có giới hạn</li>}
                    <li>Không thể quay lại sau khi submit</li>
                  </ul>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full" 
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Câu hỏi</p>
                  <p className="text-2xl">
                    {currentQuestion + 1} / {quiz.questions.length}
                  </p>
                </div>
                {quiz.time_limit_minutes && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Thời gian còn lại</p>
                    <div className={`text-2xl flex items-center gap-2 ${timeLeft < 60 ? 'text-red-600' : ''}`}>
                      <Clock className="h-5 w-5" />
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                )}
              </div>
              <Progress value={progress} />
            </CardContent>
          </Card>

          {/* Question */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">{question.question}</CardTitle>
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
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <RadioGroupItem value={index.toString()} id={`q${currentQuestion}-opt${index}`} />
                      <Label
                        htmlFor={`q${currentQuestion}-opt${index}`}
                        className="flex-1 cursor-pointer"
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
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Câu trước
            </Button>

            {currentQuestion === quiz.questions.length - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={answers.some(a => a === -1)}
                size="lg"
              >
                Nộp bài
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                disabled={answers[currentQuestion] === -1}
              >
                Câu tiếp theo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Question Navigation */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Danh sách câu hỏi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {quiz.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`aspect-square rounded-lg border-2 transition-colors ${
                      index === currentQuestion
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : answers[index] !== -1
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card>
          <CardHeader className="text-center">
            <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
              passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {passed ? (
                <Trophy className="h-10 w-10 text-green-600" />
              ) : (
                <XCircle className="h-10 w-10 text-red-600" />
              )}
            </div>
            <CardTitle className="text-3xl mb-2">
              {passed ? 'Chúc mừng! 🎉' : 'Chưa đạt'}
            </CardTitle>
            <CardDescription className="text-lg">
              {passed 
                ? 'Bạn đã vượt qua bài quiz thành công!' 
                : `Bạn cần ${quiz.passing_score}% để đạt. Hãy thử lại!`
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Score */}
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-2">Điểm của bạn</p>
              <p className={`text-6xl mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {score}%
              </p>
              <p className="text-gray-600">
                {quiz.questions.filter((q, i) => answers[i] === q.correct_answer).length}/{quiz.questions.length} câu đúng
              </p>
            </div>

            {/* Review Answers */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Đáp án chi tiết</h3>
              {quiz.questions.map((question, qIndex) => {
                const isCorrect = answers[qIndex] === question.correct_answer;
                return (
                  <Card key={qIndex} className={`border-2 ${isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium mb-2">Câu {qIndex + 1}: {question.question}</p>
                          <div className="space-y-2 text-sm">
                            <div className={`p-2 rounded ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                              <span className="font-medium">Bạn chọn: </span>
                              <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                                {question.options[answers[qIndex]]}
                              </span>
                            </div>
                            {!isCorrect && (
                              <div className="p-2 rounded bg-green-50">
                                <span className="font-medium">Đáp án đúng: </span>
                                <span className="text-green-700">
                                  {question.options[question.correct_answer]}
                                </span>
                              </div>
                            )}
                            {question.explanation && (
                              <div className="p-2 rounded bg-blue-50 text-blue-900">
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
                <Button variant="outline" className="flex-1" onClick={handleRetry}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Làm lại ({attemptsLeft - 1} lượt còn lại)
                </Button>
              )}
              <Button className="flex-1" asChild>
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
