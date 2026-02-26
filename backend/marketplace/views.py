from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Job, Bid
from .serializers import JobSerializer, BidSerializer

class JobViewSet(viewsets.ModelViewSet):
    # Add this line back - it acts as a default and helps the Router
    queryset = Job.objects.all()
    serializer_class = JobSerializer

    def get_queryset(self):
        # This function still does the heavy lifting for filtering
        queryset = Job.objects.all().order_by('-created_at')
        employer = self.request.query_params.get('employer')
        if employer:
            queryset = queryset.filter(employer_address=employer)
        return queryset
    
    def create(self, request, *args, **kwargs):
        # When React calls this, we save the text descriptions
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            job = serializer.save()
            return Response({
                "message": "Metadata saved. Now call Cairo create_job.",
                "db_id": job.id 
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BidViewSet(viewsets.ModelViewSet):
    serializer_class = BidSerializer
    
    def get_queryset(self):
        """
        Allows: /api/bids/?job_id=1
        """
        queryset = Bid.objects.all()
        job_id = self.request.query_params.get('job_id')
        if job_id:
            queryset = queryset.filter(job__onchain_id=job_id)
        return queryset