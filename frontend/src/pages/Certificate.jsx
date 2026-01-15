import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function Certificate() {
  const { enrollmentId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await fetch(`/api/certificates/${enrollmentId}`, { credentials: 'include' });
        if (!response.ok) throw new Error('Certificate not found');
        const data = await response.json();
        setCertificate(data.certificate);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [enrollmentId]);

  const downloadCertificate = async () => {
    try {
      const response = await fetch(`/api/certificates/${enrollmentId}/download`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to download certificate');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificate.course.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!certificate) return <div className="alert alert-info">Certificate not available</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Certificate of Completion</h1>
          <p className="text-lg opacity-70">Congratulations on completing your course!</p>
        </div>

        {/* Certificate Display */}
        <div className="card bg-gradient-to-br from-blue-50 to-purple-50 shadow-2xl border-4 border-primary">
          <div className="card-body text-center py-12">
            <div className="mb-8">
              <div className="text-6xl mb-4">🎓</div>
              <h2 className="text-2xl font-bold text-primary mb-2">Certificate of Achievement</h2>
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-lg opacity-70">This is to certify that</p>
              <h3 className="text-3xl font-bold text-primary">{certificate.student.name}</h3>
              <p className="text-lg opacity-70">has successfully completed the course</p>
              <h4 className="text-2xl font-semibold">{certificate.course.title}</h4>
              <p className="text-lg opacity-70">with outstanding performance</p>
            </div>

            <div className="flex justify-center items-center gap-8 mb-8">
              <div className="text-center">
                <p className="text-sm opacity-70">Completion Date</p>
                <p className="font-semibold">{new Date(certificate.completedAt).toLocaleDateString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-70">Certificate ID</p>
                <p className="font-semibold font-mono text-sm">{certificate._id}</p>
              </div>
            </div>

            <div className="border-t pt-8">
              <div className="flex justify-between items-end">
                <div className="text-left">
                  <p className="font-semibold">{certificate.instructor.name}</p>
                  <p className="text-sm opacity-70">Course Instructor</p>
                </div>
                <div className="text-center">
                  <div className="w-32 h-16 bg-primary/10 rounded flex items-center justify-center">
                    <span className="text-xs font-mono">LMS Platform</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">LMS Platform</p>
                  <p className="text-sm opacity-70">Certificate Authority</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            className="btn btn-primary btn-lg"
            onClick={downloadCertificate}
          >
            📄 Download PDF Certificate
          </button>
          <button
            className="btn btn-outline btn-lg"
            onClick={() => window.print()}
          >
            🖨️ Print Certificate
          </button>
        </div>

        {/* Share Options */}
        <div className="text-center mt-8">
          <h3 className="text-lg font-semibold mb-4">Share Your Achievement</h3>
          <div className="flex justify-center gap-2">
            <button className="btn btn-ghost btn-sm">
              📘 Facebook
            </button>
            <button className="btn btn-ghost btn-sm">
              🐦 Twitter
            </button>
            <button className="btn btn-ghost btn-sm">
              💼 LinkedIn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}