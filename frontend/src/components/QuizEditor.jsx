import React, { useState } from 'react';

export default function QuizEditor({ quiz, onSave, onCancel }) {
  const [questions, setQuestions] = useState(quiz?.questions || []);
  const [title, setTitle] = useState(quiz?.title || '');
  const [description, setDescription] = useState(quiz?.description || '');

  const addQuestion = () => {
    const newQuestion = {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const deleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const quizData = {
      title,
      description,
      questions: questions.filter(q => q.question.trim() !== ''),
    };
    onSave(quizData);
  };

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Quiz Settings</h2>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Quiz Title</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Description (Optional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Quiz description"
              rows="2"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Questions</h3>
          <button className="btn btn-primary" onClick={addQuestion}>
            Add Question
          </button>
        </div>

        {questions.map((question, qIndex) => (
          <div key={qIndex} className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-semibold">Question {qIndex + 1}</h4>
                <button
                  className="btn btn-error btn-sm"
                  onClick={() => deleteQuestion(qIndex)}
                >
                  Delete
                </button>
              </div>

              <div className="form-control mb-4">
                <input
                  type="text"
                  className="input input-bordered"
                  value={question.question}
                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                  placeholder="Enter your question"
                />
              </div>

              <div className="space-y-2 mb-4">
                <label className="label">
                  <span className="label-text">Answer Options</span>
                </label>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={question.correctAnswer === oIndex}
                      onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                      className="radio"
                    />
                    <input
                      type="text"
                      className="input input-bordered flex-1"
                      value={option}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Explanation (Optional)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={question.explanation}
                  onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                  placeholder="Explain why this is the correct answer"
                  rows="2"
                />
              </div>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No questions added yet. Click "Add Question" to get started.
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!title.trim() || questions.length === 0}
        >
          Save Quiz
        </button>
      </div>
    </div>
  );
}