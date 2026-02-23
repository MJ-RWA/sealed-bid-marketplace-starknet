from rest_framework import serializers
from .models import Job, Bid

# Converters to convert database to Json format for communication with react and starknet.
class JobSerializer(serializers.ModelSerializer):
    # We include the count of bids so the frontend can show "5 bids received"
    bid_count = serializers.IntegerField(source='bids.count', read_only=True)

    class Meta:
        model = Job
        fields = '__all__'

class BidSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bid
        fields = '__all__'