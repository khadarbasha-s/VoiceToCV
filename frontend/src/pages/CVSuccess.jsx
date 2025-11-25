import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircleIcon, DocumentArrowDownIcon, BriefcaseIcon } from '@heroicons/react/24/solid';

/**
 * CVSuccess Page - Shown after CV generation
 * Provides two options:
 * 1. Apply Now - Takes user to TalentPath job portal
 * 2. Apply Later - Download CV and exit
 */
const CVSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [downloading, setDownloading] = useState(false);

  // CV data passed from generation page
  const { cvData, docxBase64, htmlContent, sessionId } = location.state || {};

  // Debug: Log received data
  React.useEffect(() => {
    console.log("CVSuccess - Received state:", { 
      hasCvData: !!cvData, 
      hasDocx: !!docxBase64, 
      hasHtml: !!htmlContent, 
      sessionId 
    });
  }, []);

  const handleApplyNow = async () => {
    try {
      // Try to save the CV data to TalentPath system (optional)
      const response = await fetch('http://127.0.0.1:8000/api/talentpath/resume/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cv_data: cvData,
          file_url: '' // Can be populated if you upload to cloud storage
        })
      });

      if (response.ok) {
        console.log('Resume saved successfully to TalentPath');
      } else {
        console.warn('Resume save failed, but continuing to TalentPath');
      }
    } catch (error) {
      console.error('Error saving resume (continuing anyway):', error);
    }
    
    // Navigate to TalentPath Dashboard regardless of save status
    // Store CV data in localStorage as backup
    try {
      localStorage.setItem('currentCV', JSON.stringify(cvData));
      localStorage.setItem('currentCVDocx', docxBase64);
    } catch (e) {
      console.error('Failed to store CV in localStorage:', e);
    }
    
    navigate('/talentpath/dashboard');
  };

  const handleApplyLater = () => {
    // Download the CV
    if (docxBase64) {
      downloadCV();
    }
    
    // Redirect to home or show thank you message
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const downloadCV = () => {
    try {
      setDownloading(true);
      
      // Convert base64 to blob
      const byteCharacters = atob(docxBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${cvData?.personal_info?.name || 'resume'}_CV.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloading(false);
    } catch (error) {
      console.error('Error downloading CV:', error);
      alert('Failed to download CV');
      setDownloading(false);
    }
  };

  // Show error if no state data was passed
  if (!location.state) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Missing CV Data</h1>
          <p className="text-gray-600 mb-6">
            It looks like you navigated here directly without generating a CV first.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your CV is Ready! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Congratulations! Your professional CV has been generated successfully.
          </p>
          
          <p className="text-lg text-gray-500">
            What would you like to do next?
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Apply Now Card */}
          <div 
            onClick={handleApplyNow}
            className="bg-white rounded-2xl border-2 border-teal-500 p-8 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4 group-hover:bg-teal-500 transition-colors">
                <BriefcaseIcon className="w-8 h-8 text-teal-600 group-hover:text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Apply Now
              </h2>
              
              <p className="text-gray-600 mb-6">
                Start your job search immediately with TalentPath. Get AI-powered job recommendations based on your CV.
              </p>
              
              <ul className="text-sm text-gray-500 space-y-2 mb-6 text-left w-full">
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 font-bold">✓</span>
                  <span>AI-matched job recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 font-bold">✓</span>
                  <span>One-click job applications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 font-bold">✓</span>
                  <span>Track application status</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 font-bold">✓</span>
                  <span>Direct contact with recruiters</span>
                </li>
              </ul>
              
              <button className="w-full px-6 py-4 bg-teal-500 text-white rounded-xl font-bold text-lg hover:bg-teal-600 transition-colors shadow-lg hover:shadow-xl">
                Go to TalentPath →
              </button>
            </div>
          </div>

          {/* Apply Later Card */}
          <div 
            onClick={handleApplyLater}
            className="bg-white rounded-2xl border-2 border-blue-500 p-8 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                <DocumentArrowDownIcon className="w-8 h-8 text-blue-600 group-hover:text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Apply Later
              </h2>
              
              <p className="text-gray-600 mb-6">
                Download your CV and apply to jobs at your own pace. You can always come back to TalentPath later.
              </p>
              
              <ul className="text-sm text-gray-500 space-y-2 mb-6 text-left w-full">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Download DOCX format</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Edit anytime in MS Word</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Apply on any job portal</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Return to TalentPath anytime</span>
                </li>
              </ul>
              
              <button 
                className="w-full px-6 py-4 bg-blue-500 text-white rounded-xl font-bold text-lg hover:bg-blue-600 transition-colors shadow-lg hover:shadow-xl"
                disabled={downloading}
              >
                {downloading ? 'Downloading...' : 'Download CV & Exit'}
              </button>
            </div>
          </div>
        </div>

        {/* CV Preview (Optional) */}
        {htmlContent && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">CV Preview</h3>
              <button
                onClick={downloadCV}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Download Only
              </button>
            </div>
            <div 
              className="prose prose-sm max-w-none bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            💡 Tip: Using TalentPath increases your chances of getting hired by 3x with AI-matched jobs!
          </p>
        </div>
      </div>
    </div>
  );
};

export default CVSuccess;




