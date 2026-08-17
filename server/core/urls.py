from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponseRedirect
from django.conf import settings
from django.conf.urls.static import static
from core.admin import admin_site

from rides.views import LocationDetailView, LocationSearchView

urlpatterns = [
    # Unfold templates reverse `{% url "search" %}`; provide a minimal global URL name.
    path("admin/search/", lambda request: HttpResponseRedirect("/admin/"), name="search"),

    path('admin/', admin_site.urls),
    path('api/users/', include('users.urls')),
    path('api/rides/', include('rides.urls')),
    path('api/locations/', LocationSearchView.as_view()),
    path('api/location-details/', LocationDetailView.as_view()),
    path('api/notifications/', include('notifications.urls')),
    path('api/payments/', include('payments.urls')),
]

# Serves static files (Unfold CSS/JS) during local development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)