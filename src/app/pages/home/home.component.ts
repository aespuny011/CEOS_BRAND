import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('videoIzquierdo') videoIzquierdo!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoDerecho') videoDerecho!: ElementRef<HTMLVideoElement>;
  
  videosIntentados = 0;
  readonly TOTAL_VIDEOS = 2;

  constructor() {}

  ngOnInit(): void {
    // Precargar los videos
    this.preloadVideos();
  }

  ngAfterViewInit(): void {
    // Intentar reproducir inmediatamente
    this.reproducirVideos();
    
    // Intentar de nuevo después de 1 segundo
    setTimeout(() => this.reproducirVideos(), 1000);
    
    // Intentar cuando la página esté completamente cargada
    window.addEventListener('load', () => {
      this.reproducirVideos();
    });

    // Intentar cuando el usuario haga clic en cualquier parte
    document.addEventListener('click', () => {
      this.reproducirVideos();
    }, { once: true });

    // Intentar cuando el usuario toque la pantalla (móvil)
    document.addEventListener('touchstart', () => {
      this.reproducirVideos();
    }, { once: true });
  }

  preloadVideos(): void {
    // Precargar los videos
    const videos = [
      'assets/videos/video-izquierdo.mp4',
      'assets/videos/video-derecho.mp4'
    ];
    
    videos.forEach(src => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = src;
      video.load();
    });
  }

  reproducirVideos(): void {
    if (this.videosIntentados >= this.TOTAL_VIDEOS) return;
    
    this.intentarReproducirVideo('izquierdo');
    this.intentarReproducirVideo('derecho');
  }

  intentarReproducirVideo(lado: 'izquierdo' | 'derecho'): void {
    const videoElement = lado === 'izquierdo' 
      ? this.videoIzquierdo?.nativeElement 
      : this.videoDerecho?.nativeElement;
    
    if (!videoElement) return;

    // Marcar como intentado
    const index = lado === 'izquierdo' ? 0 : 1;
    if (this.videosIntentados & (1 << index)) return;
    
    // Configurar volumen a 0 para asegurar muted
    videoElement.volume = 0;
    videoElement.muted = true;
    
    // Intentar reproducir
    const playPromise = videoElement.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log(`Video ${lado} reproduciéndose`);
          this.videosIntentados |= (1 << index);
          
          // Asegurar que está muteado
          videoElement.muted = true;
          videoElement.volume = 0;
        })
        .catch((error) => {
          console.log(`Error reproduciendo video ${lado}:`, error);
          
          // Intentar estrategia alternativa: cargar y reproducir manualmente
          this.reproducirConEstrategiaAlternativa(videoElement, lado);
        });
    }
  }

  reproducirConEstrategiaAlternativa(video: HTMLVideoElement, lado: string): void {
    try {
      // Recargar el video
      video.load();
      
      // Configurar atributos críticos
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.preload = 'auto';
      
      // Intentar reproducción diferida
      setTimeout(() => {
        video.play()
          .then(() => console.log(`Video ${lado} reproducido con estrategia alternativa`))
          .catch(e => console.log(`Fallo estrategia alternativa para ${lado}:`, e));
      }, 500);
    } catch (error) {
      console.error(`Error en estrategia alternativa para ${lado}:`, error);
    }
  }

  onVideoError(event: Event, lado: string): void {
    console.error(`Error cargando video ${lado}:`, event);
    // Mostrar mensaje en consola pero no bloquear
  }

  onVideoLoaded(lado: string): void {
    console.log(`Video ${lado} cargado correctamente`);
    // Asegurar que está muteado
    const video = lado === 'izquierdo' 
      ? this.videoIzquierdo?.nativeElement 
      : this.videoDerecho?.nativeElement;
    
    if (video) {
      video.muted = true;
      video.volume = 0;
    }
  }
}