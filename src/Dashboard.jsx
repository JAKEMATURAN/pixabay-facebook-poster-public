// Core web app to fetch videos from Pixabay and show in a dashboard and connect Facebook Login

import React, { useEffect, useState } from 'react';

const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY;
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

export default function Dashboard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fbReady, setFbReady] = useState(false);
  const [userAccessToken, setUserAccessToken] = useState(null);
  const [pageAccessToken, setPageAccessToken] = useState(null);
  const [pageId, setPageId] = useState(null);

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v19.0'
      });
      setFbReady(true);
    };

    (function (d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  useEffect(() => {
    fetch(`https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=nature&per_page=9`)
      .then((res) => res.json())
      .then((data) => {
        setVideos(data.hits || []);
        setLoading(false);
      });
  }, []);

  const handleFacebookLogin = () => {
    if (!fbReady) return;
    window.FB.login(response => {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        setUserAccessToken(accessToken);

        window.FB.api('/me/accounts', function (res) {
          if (res && !res.error) {
            const page = res.data[0];
            setPageId(page.id);
            setPageAccessToken(page.access_token);
            alert('Page access token received!');
          } else {
            alert('Failed to get page info.');
          }
        });
      } else {
        alert('Facebook login failed.');
      }
    }, {
      scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,publish_to_groups,publish_video'
    });
  };

  const handleApprove = (videoUrl) => {
    if (!userAccessToken || !pageAccessToken || !pageId) {
      alert('Please log in with Facebook and select a Page.');
      return;
    }

    fetch(`https://graph.facebook.com/${pageId}/videos`, {
      method: 'POST',
      body: new URLSearchParams({
        file_url: videoUrl,
        access_token: pageAccessToken,
        title: 'Auto-posted video',
        description: 'Shared from Pixabay'
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.id) {
        alert('✅ Video posted to your Facebook Page!');
      } else {
        console.error(data);
        alert('❌ Failed to post video.');
      }
    });
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        {!userAccessToken ? (
          <button onClick={handleFacebookLogin}>Login with Facebook</button>
        ) : (
          <div className="text-green-600 font-bold">✅ Logged in with Facebook</div>
        )}
      </div>

      {loading ? (
        <div className="text-center mt-10">Loading videos...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div key={video.id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '10px' }}>
              <video controls width="100%">
                <source src={video.videos.medium.url} type="video/mp4" />
              </video>
              <div style={{ marginTop: '0.5rem' }}>Tags: {video.tags}</div>
              <button onClick={() => handleApprove(video.videos.medium.url)} style={{ marginTop: '0.5rem', width: '100%' }}>
                Approve & Post to Facebook
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
