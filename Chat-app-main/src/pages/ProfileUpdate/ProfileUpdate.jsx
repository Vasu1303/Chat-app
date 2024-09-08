import React, { useEffect, useState, useContext } from 'react';
import './ProfileUpdate.css';
import assets from '../../assets/assets';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import upload from '../../lib/upload';
import { auth, db } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  
  const [image, setImage] = useState(null);
  const [uid, setUid] = useState('');
  const [prevImage, setPrevImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setUserData } = useContext(AppContext);

  const profileUpdate = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (!prevImage && !image) {
        toast.error('Upload profile picture');
        setLoading(false);
        return;
      }

      const docRef = doc(db, 'users', uid);

      if (image) {
        const imgURL = await upload(image);
        setPrevImage(imgURL);
        await updateDoc(docRef, {
          avatar: imgURL,
          bio: bio,
          name: name,
        });
      } else {
        await updateDoc(docRef, {
          bio: bio,
          name: name,
        });
      }
      const snap = await getDoc(docRef);
      setUserData(snap.data());
      navigate('/chat');
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Error updating profile. Please try again.');
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || '');
          setBio(data.bio || '');
          setPrevImage(data.avatar || null);
        }
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  return (
    <div className='profile'>
      <div className='profile-container'>
        <form onSubmit={profileUpdate}>
          <h3>Profile Details</h3>
          <label htmlFor='avatar'>
            <input
              onChange={(e) => setImage(e.target.files[0])}
              type='file'
              id='avatar'
              accept='.png, .jpg, .jpeg'
              hidden
              aria-label='Upload profile image'
            />
            <img
              src={
                image
                  ? URL.createObjectURL(image)
                  : prevImage || assets.avatar_icon
              }
              alt='Profile Preview'
            />
            Upload profile image
          </label>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type='text'
            placeholder='Your name'
            required
            aria-label='Your name'
          />
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder='Write Profile Bio'
            required
            aria-label='Profile bio'
          />
          <button type='submit' disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </form>
        <img
          className='profile-pic'
          src={
            prevImage ||
            (image ? URL.createObjectURL(image) : assets.logo_icon)
          }
          alt='Profile'
        />
      </div>
    </div>
  );
};

export default ProfileUpdate;



