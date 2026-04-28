import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { AuthService } from '../../services/auth.service';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('videoIzquierdo') videoIzquierdo!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoDerecho') videoDerecho!: ElementRef<HTMLVideoElement>;

  videosIntentados = 0;
  readonly totalVideos = 2;
  featuredProducts: Product[] = [];

  constructor(
    public authService: AuthService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.preloadVideos();
    this.authService.restoreSession().subscribe();
    this.loadFeaturedProducts();
  }

  ngAfterViewInit(): void {
    this.reproducirVideos();
    setTimeout(() => this.reproducirVideos(), 1000);

    window.addEventListener('load', () => {
      this.reproducirVideos();
    });

    document.addEventListener(
      'click',
      () => {
        this.reproducirVideos();
      },
      { once: true }
    );

    document.addEventListener(
      'touchstart',
      () => {
        this.reproducirVideos();
      },
      { once: true }
    );
  }

  preloadVideos(): void {
    const videos = ['assets/videos/video-izquierdo.mp4', 'assets/videos/video-derecho.mp4'];

    videos.forEach((src) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = src;
      video.load();
    });
  }

  reproducirVideos(): void {
    if (this.videosIntentados >= this.totalVideos) return;

    this.intentarReproducirVideo('izquierdo');
    this.intentarReproducirVideo('derecho');
  }

  intentarReproducirVideo(lado: 'izquierdo' | 'derecho'): void {
    const videoElement =
      lado === 'izquierdo' ? this.videoIzquierdo?.nativeElement : this.videoDerecho?.nativeElement;

    if (!videoElement) return;

    const index = lado === 'izquierdo' ? 0 : 1;
    if (this.videosIntentados & (1 << index)) return;

    videoElement.volume = 0;
    videoElement.muted = true;

    const playPromise = videoElement.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.videosIntentados |= 1 << index;
          videoElement.muted = true;
          videoElement.volume = 0;
        })
        .catch(() => {
          this.reproducirConEstrategiaAlternativa(videoElement);
        });
    }
  }

  reproducirConEstrategiaAlternativa(video: HTMLVideoElement): void {
    video.load();
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = 'auto';

    setTimeout(() => {
      video.play().catch(() => undefined);
    }, 500);
  }

  onVideoError(): void {}

  onVideoLoaded(lado: 'izquierdo' | 'derecho'): void {
    const video =
      lado === 'izquierdo' ? this.videoIzquierdo?.nativeElement : this.videoDerecho?.nativeElement;

    if (video) {
      video.muted = true;
      video.volume = 0;
    }
  }

  private loadFeaturedProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.featuredProducts = products
          .filter((product) => product.status !== 'Oculto')
          .slice(0, 4);
      },
      error: () => {
        this.featuredProducts = [];
      },
    });
  }
}
