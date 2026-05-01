import { useState, useCallback, useEffect } from "react";
import { postsApi } from "../api/index.js";
import { useAuth } from "./useAuth.js";

export function usePosts() {
  const { currentUser } = useAuth();
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(false);

  const loadFeed = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await postsApi.feed(page);
      const incoming = (data.posts || []).map((p) => ({
        ...p,
        likes: new Set(p.liked ? [currentUser?.id] : []),
      }));
      if (page === 1) setPosts(incoming);
      else setPosts((prev) => [...prev, ...incoming]);
    } catch (e) {
      console.error("Feed load failed:", e.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  const addPost = useCallback(async (content, tags, image) => {
    const p = await postsApi.create({ content, tags, image });
    setPosts((prev) => [{ ...p, likes: new Set(), comments: [], isNew: true }, ...prev]);
    return p;
  }, []);

  const toggleLike = useCallback(async (postId) => {
    const result = await postsApi.toggleLike(postId);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const likes = new Set(p.likes);
        result.liked ? likes.add(currentUser?.id) : likes.delete(currentUser?.id);
        return { ...p, likes, liked: result.liked, like_count: result.like_count };
      })
    );
    return result;
  }, [currentUser?.id]);

  const addComment = useCallback(async (postId, text) => {
    const comment = await postsApi.addComment(postId, text);
    setPosts((prev) =>
      prev.map((p) =>
        p.id !== postId ? p : { ...p, comments: [...(p.comments || []), comment] }
      )
    );
    return comment;
  }, []);

  useEffect(() => {
    setPosts([]);
    setLoading(false);
  }, [currentUser?.id]);

  return { posts, loading, loadFeed, addPost, toggleLike, addComment, setPosts };
}
