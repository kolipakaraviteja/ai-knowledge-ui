import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  // Only intercept API requests
  if (!request.url.includes('/api/')) {
    return next(request);
  }

  // Clone request and add credentials
  const apiRequest = request.clone({
    withCredentials: true,
  });

  return next(apiRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('API Error [' + error.status + ']:', error.message);
      if (error.status === 0) {
        console.error('Connection failed. Ensure backend is running');
      }
      return throwError(() => error);
    })
  );
};
