import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { HelpComponent } from './pages/help/help.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { CartComponent } from './pages/cart/cart.component';
import { ContactComponent } from './pages/contact/contact.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { MyOrdersComponent } from './pages/my-orders/my-orders.component';
import { AdminOrdersComponent } from './pages/admin-orders/admin-orders.component';
import { ProductListComponent } from './products/product-list/product-list.component';
import { ProductDetailComponent } from './products/product-detail/product-detail.component';
import { CrearProductoComponent } from './pages/crear-producto/crear-producto.component';
import { EditarProductoComponent } from './pages/editar-producto/editar-producto.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'sobre-nosotros', component: AboutComponent },
  { path: 'ayuda', component: HelpComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'productos', component: ProductListComponent, canActivate: [AuthGuard] },
  { path: 'productos/:id', component: ProductDetailComponent, canActivate: [AuthGuard] },
  { path: 'carrito', component: CartComponent, canActivate: [AuthGuard] },
  { path: 'contacto', component: ContactComponent, canActivate: [AuthGuard] },
  { path: 'mi-perfil', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'mis-pedidos', component: MyOrdersComponent, canActivate: [AuthGuard] },
  { path: 'admin/pedidos', component: AdminOrdersComponent, canActivate: [AdminGuard] },
  { path: 'nuevo', component: CrearProductoComponent, canActivate: [AdminGuard] },
  { path: 'editar-producto/:id', component: EditarProductoComponent, canActivate: [AdminGuard] },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
