from django.db import models

class Job(models.Model):
    # Mapping to the Blockchain ID
    onchain_id = models.IntegerField(unique=True, null=True, blank=True)
    
    # Metadata: We store this data here since we can't store this onchain due to gas fees.
    title = models.CharField(max_length=255)
    description = models.TextField()

    # Onchain but needed here for synchronization: The employer address and the price and time weights of a job
    employer_address = models.CharField(max_length=66, db_index=True)
    price_weight = models.IntegerField(default=50)
    timeline_weight = models.IntegerField(default=50)
    
    # Mirrors the Enum in the smart contract in lib.cairo
    STATUS_CHOICES = [
        ('BIDDING', 'Bidding'),
        ('REVEAL', 'Reveal'),
        ('SHORTLISTED', 'Shortlisted'),
        ('FINALIZED', 'Finalized'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='BIDDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Job {self.onchain_id or 'Unsynced'}: {self.title}"

class Bid(models.Model):
    # Every bid and corresponding bidder address is linked to a Job - 
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="bids")
    bidder_address = models.CharField(max_length=66, db_index=True)
    
    # Values revealed in Phase 3
    # Use Decimal to store large BigInts safely from Starknet
    price = models.DecimalField(max_digits=78, decimal_places=0, null=True, blank=True)
    timeline = models.IntegerField(null=True, blank=True)
    
    is_shortlisted = models.BooleanField(default=False)
    revealed_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"Bid by {self.bidder_address} on Job {self.job.onchain_id}"