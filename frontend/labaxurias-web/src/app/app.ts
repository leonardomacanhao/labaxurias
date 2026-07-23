import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateRouteClass(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        this.updateRouteClass(event.urlAfterRedirects);
      });
  }

  private updateRouteClass(url: string): void {
    document.body.classList.toggle('public-screen-route', url.startsWith('/public'));
  }
}
