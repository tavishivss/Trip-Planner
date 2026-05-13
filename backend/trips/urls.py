from django.urls import path
from . import views

urlpatterns = [
    path('api/plan-trip/', views.plan_trip_view, name='plan-trip'),
    path('api/geocode/', views.geocode_search, name='geocode-search'),
]
