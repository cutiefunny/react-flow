import { useState, useEffect } from 'react';
import styles from './Board.module.css';
import useAlert from './hooks/useAlert';

// Simple SVG Icons for file types
const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);


function Board({ user }) {
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState('');
  const { showAlert, showConfirm } = useAlert();

  // Initialize with sample posts (in-memory storage for demo)
  useEffect(() => {
    const samplePosts = [
      {
        id: '1',
        author: 'John Doe',
        authorId: 'user1',
        authorPhotoURL: 'https://cattlefield.net/cat_jump.png',
        text: 'Welcome to the Board! This is a shared space for collaboration.',
        timestamp: new Date(),
        fileUrl: '',
        fileName: '',
        fileType: '',
      }
    ];
    setPosts(samplePosts);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showAlert("Please log in to write a post.");
      return;
    }
    if (!newPostText.trim() && !fileToUpload) {
      showAlert("Please enter some text or select a file.");
      return;
    }

    setIsLoading(true);

    let fileUrl = '';
    let fileName = '';
    let fileType = '';

    if (fileToUpload) {
      fileName = fileToUpload.name;
      fileType = fileToUpload.type.startsWith('image/') ? 'image' : 'file';
      // In development mode, create a preview URL
      fileUrl = URL.createObjectURL(fileToUpload);
    }

    try {
      const newPost = {
        id: Date.now().toString(),
        author: user.displayName,
        authorId: user.uid || 'dev-user',
        authorPhotoURL: user.photoURL,
        text: newPostText,
        timestamp: new Date(),
        fileUrl,
        fileName,
        fileType,
      };

      setPosts([newPost, ...posts]);
      setNewPostText('');
      setFileToUpload(null);
      if(document.getElementById('fileInput')) {
        document.getElementById('fileInput').value = '';
      }
      showAlert('Post created successfully!');
    } catch (error) {
      console.error("Error adding post: ", error);
      showAlert("Failed to create post.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (post) => {
    if (!user) {
      showAlert("Please log in to delete a post.");
      return;
    }
    if (post.authorId !== (user.uid || 'dev-user')) {
      showAlert("You can only delete your own posts.");
      return;
    }

    const confirmed = await showConfirm("Are you sure you want to delete this post?");
    if (!confirmed) {
      return;
    }

    try {
      setPosts(posts.filter(p => p.id !== post.id));
      showAlert('Post deleted successfully!');
    } catch (error) {
      console.error("Error deleting post: ", error);
      showAlert("Failed to delete post.");
    }
  };

  const handleEditClick = (post) => {
    if (!user) {
        showAlert("Please log in to edit a post.");
        return;
    }
    setEditingPostId(post.id);
    setEditText(post.text);
  };

  const handleUpdatePost = async (postId) => {
    try {
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, text: editText } : p
      ));
      setEditingPostId(null);
      setEditText('');
      showAlert('Post updated successfully!');
    } catch (error) {
      console.error("Error updating post: ", error);
      showAlert("Failed to update post.");
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditText('');
  };


  return (
    <div className={styles.boardContainer}>
      {user ? (
        <form className={styles.postForm} onSubmit={handlePostSubmit}>
          <textarea
            className={styles.textarea}
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder="What's on your mind?"
          />
          <div className={styles.formActions}>
            <div>
              <label htmlFor="fileInput" className={styles.fileInputLabel}>
                <ImageIcon /> Add Photo/File
              </label>
              <input
                id="fileInput"
                type="file"
                className={styles.fileInput}
                onChange={handleFileChange}
              />
              {fileToUpload && <span className={styles.fileName}>{fileToUpload.name}</span>}
            </div>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.postForm} style={{textAlign: 'center', padding: '30px'}}>
            <p>Please log in to write posts.</p>
        </div>
      )}

      {posts.length === 0 && !isLoading && <div className={styles.loading}>No posts yet. Be the first!</div>}

      <div className={styles.postList}>
        {posts.map((post) => (
          <div key={post.id} className={styles.post}>
            <div className={styles.postHeader}>
              <div className={styles.authorSection}>
                <img src={post.authorPhotoURL} alt={post.author} className={styles.avatar} />
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{post.author || 'Anonymous'}</span>
                  <span className={styles.timestamp}>
                    {post.timestamp?.toLocaleString()}
                  </span>
                </div>
              </div>
              {user && user.uid === post.authorId && (
                <div className={styles.buttonGroup}>
                   <button onClick={() => handleEditClick(post)} className={styles.editButton}>
                    Edit
                  </button>
                  <button onClick={() => handleDeletePost(post)} className={styles.deleteButton}>
                    &times;
                  </button>
                </div>
              )}
            </div>
            <div className={styles.postContent}>
              {editingPostId === post.id ? (
                <div className={styles.editForm}>
                  <textarea
                    className={styles.editTextarea}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className={styles.editActions}>
                    <button onClick={() => handleUpdatePost(post.id)} className={styles.saveButton}>Save</button>
                    <button onClick={handleCancelEdit} className={styles.cancelButton}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {post.text && <p>{post.text}</p>}
                  {post.fileType === 'image' && post.fileUrl && (
                    <img src={post.fileUrl} alt="Post content" className={styles.postImage} />
                  )}
                  {post.fileType === 'file' && (
                    <div className={styles.postFile}>
                      <FileIcon />
                      <span className={styles.fileName}>
                        {post.fileName}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Board;
