// src/components/product/singleProduct/ProductImage.tsx (updated)
import { useState, useEffect, useRef, TouchEvent } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { BsZoomIn } from "react-icons/bs";

interface ProductImageProps {
  productId?: string;
  images?: string[];
}

const API_URL = import.meta.env.VITE_API_URL;

const ProductImage = ({ productId, images = [] }: ProductImageProps) => {
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  // Touch handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Prepare image URLs
  useEffect(() => {
    setLoading(true);
    
    if (images.length > 0) {
      const urls = images.map(img => `${API_URL}/uploads/${img}`);
      setImageUrls(urls);
      setCurrentImageIndex(0);
      setLoading(false);
    } else {
      // Fallback to placeholder if no images
      setImageUrls(["https://placehold.co/400x400?text=No+Image"]);
      setLoading(false);
    }
  }, [images, productId]);

  const navigateToImage = (index: number) => {
    if (transitioning || imageUrls.length <= 1 || index === currentImageIndex)
      return;

    setTransitioning(true);
    setZoomed(false);

    // Apply transition
    if (slideContainerRef.current) {
      const direction = index > currentImageIndex ? "next" : "prev";
      slideContainerRef.current.style.transition = "transform 300ms ease-out";
      slideContainerRef.current.style.transform =
        direction === "next" ? "translateX(-100%)" : "translateX(100%)";

      setTimeout(() => {
        setCurrentImageIndex(index);
        slideContainerRef.current!.style.transition = "none";
        slideContainerRef.current!.style.transform = "translateX(0)";
        setTransitioning(false);
      }, 300);
    }
  };

  const nextImage = () => {
    if (imageUrls.length <= 1) return;
    const nextIndex =
      currentImageIndex === imageUrls.length - 1 ? 0 : currentImageIndex + 1;
    navigateToImage(nextIndex);
  };

  const prevImage = () => {
    if (imageUrls.length <= 1) return;
    const prevIndex =
      currentImageIndex === 0 ? imageUrls.length - 1 : currentImageIndex - 1;
    navigateToImage(prevIndex);
  };

  // Toggle zoom effect
  const toggleZoom = () => {
    if (transitioning) return;
    setZoomed(!zoomed);
  };

  // Touch event handlers
  const handleTouchStart = (e: TouchEvent) => {
    if (zoomed) return;
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (zoomed) return;
    touchEndX.current = e.touches[0].clientX;

    if (touchStartX.current && touchEndX.current && slideContainerRef.current) {
      const diffX = touchEndX.current - touchStartX.current;
      const threshold = 20;

      if (Math.abs(diffX) > threshold) {
        const translateX = Math.min(Math.max(-100, diffX / 3), 100);
        slideContainerRef.current.style.transform