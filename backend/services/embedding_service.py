"""
Embedding Service

Generates vector embeddings using AWS Bedrock Titan Embeddings.
Reuses BedrockClient pattern for consistency.
"""

import json
import logging
from typing import List, Optional, Dict
import boto3
from botocore.exceptions import ClientError
import time

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Service for generating vector embeddings using AWS Bedrock Titan.
    
    Model: amazon.titan-embed-text-v2:0 (default)
    Dimensions: 1024 (v2) or 768 (v1)
    
    Titan v2 improvements:
    - Better quality embeddings
    - Configurable dimensions (256, 512, 1024)
    - Normalized by default
    """
    
    def __init__(
        self,
        region_name: str = "us-east-1",
        model_id: str = "amazon.titan-embed-text-v2:0"
    ):
        """
        Initialize embedding service.
        
        Args:
            region_name: AWS region for Bedrock
            model_id: Titan Embeddings model ID (v2 recommended)
        """
        self.region_name = region_name
        self.model_id = model_id
        
        # Set dimensions based on model
        if "v2" in model_id:
            self.embedding_dimensions = 1024  # Titan v2 default
        elif "v1" in model_id:
            self.embedding_dimensions = 768   # Titan v1
        else:
            self.embedding_dimensions = 1024  # Default to v2
        
        # Initialize boto3 client
        try:
            self.client = boto3.client('bedrock-runtime', region_name=region_name)
            logger.info(f"Initialized EmbeddingService with model {model_id} ({self.embedding_dimensions} dimensions)")
        except Exception as e:
            raise Exception(f"Failed to initialize Bedrock client for embeddings: {e}")
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector (1024 dimensions for v2, 768 for v1)
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        # Truncate if too long (Titan has 8K token limit)
        max_chars = 8000 * 4  # Approximate 4 chars per token
        if len(text) > max_chars:
            text = text[:max_chars]
            logger.warning(f"Text truncated to {max_chars} characters")
        
        # Titan v2 uses different request format
        if "v2" in self.model_id:
            request_body = {
                "inputText": text,
                "dimensions": self.embedding_dimensions,
                "normalize": True
            }
        else:
            request_body = {
                "inputText": text
            }
        
        try:
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            embedding = response_body.get('embedding')
            
            if not embedding:
                raise ValueError("No embedding in response")
            
            # Log actual dimensions received
            actual_dims = len(embedding)
            if actual_dims != self.embedding_dimensions:
                logger.warning(f"Expected {self.embedding_dimensions} dimensions, got {actual_dims}. Updating expected dimensions.")
                self.embedding_dimensions = actual_dims
            
            return embedding
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"Bedrock API error: {error_code} - {error_message}")
            raise Exception(f"Failed to generate embedding: {error_message}")
        except Exception as e:
            logger.error(f"Unexpected error generating embedding: {e}")
            raise
    
    def generate_embeddings_batch(
        self,
        texts: List[str],
        batch_size: int = 25
    ) -> List[Optional[List[float]]]:
        """
        Generate embeddings for multiple texts with batching.
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts to process per batch
            
        Returns:
            List of embeddings (None for failed texts)
        """
        if not texts:
            return []
        
        logger.info(f"Generating embeddings for {len(texts)} texts in batches of {batch_size}")
        
        embeddings = []
        failed_count = 0
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_num = i // batch_size + 1
            total_batches = (len(texts) + batch_size - 1) // batch_size
            
            logger.debug(f"Processing batch {batch_num}/{total_batches}")
            
            for text in batch:
                try:
                    embedding = self.generate_embedding(text)
                    embeddings.append(embedding)
                except Exception as e:
                    logger.error(f"Failed to generate embedding: {e}")
                    embeddings.append(None)
                    failed_count += 1
                
                # Small delay to avoid rate limiting
                time.sleep(0.1)
        
        success_count = len(embeddings) - failed_count
        logger.info(f"Generated {success_count}/{len(texts)} embeddings successfully")
        
        if failed_count > 0:
            logger.warning(f"{failed_count} embeddings failed")
        
        return embeddings
    
    def generate_embeddings_with_retry(
        self,
        texts: List[str],
        max_retries: int = 3
    ) -> List[Optional[List[float]]]:
        """
        Generate embeddings with retry logic for failed texts.
        
        Args:
            texts: List of texts to embed
            max_retries: Maximum retry attempts per text
            
        Returns:
            List of embeddings (None for permanently failed texts)
        """
        embeddings = [None] * len(texts)
        retry_indices = list(range(len(texts)))
        
        for attempt in range(max_retries):
            if not retry_indices:
                break
            
            logger.info(f"Attempt {attempt + 1}/{max_retries}: Processing {len(retry_indices)} texts")
            
            current_retry_indices = []
            
            for idx in retry_indices:
                try:
                    embedding = self.generate_embedding(texts[idx])
                    embeddings[idx] = embedding
                except Exception as e:
                    logger.warning(f"Failed to generate embedding for text {idx}: {e}")
                    if attempt < max_retries - 1:
                        current_retry_indices.append(idx)
                
                # Delay between requests
                time.sleep(0.1)
            
            retry_indices = current_retry_indices
            
            if retry_indices and attempt < max_retries - 1:
                # Exponential backoff between retry attempts
                wait_time = (2 ** attempt) * 1
                logger.info(f"Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
        
        success_count = sum(1 for e in embeddings if e is not None)
        logger.info(f"Final result: {success_count}/{len(texts)} embeddings generated")
        
        return embeddings
    
    def calculate_similarity(
        self,
        embedding1: List[float],
        embedding2: List[float]
    ) -> float:
        """
        Calculate cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Cosine similarity score (0.0 to 1.0)
        """
        if len(embedding1) != len(embedding2):
            raise ValueError("Embeddings must have same dimensions")
        
        # Dot product
        dot_product = sum(a * b for a, b in zip(embedding1, embedding2))
        
        # Magnitudes
        magnitude1 = sum(a * a for a in embedding1) ** 0.5
        magnitude2 = sum(b * b for b in embedding2) ** 0.5
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        # Cosine similarity
        similarity = dot_product / (magnitude1 * magnitude2)
        
        # Normalize to 0-1 range (cosine similarity is -1 to 1)
        normalized = (similarity + 1) / 2
        
        return normalized
    
    def get_embedding_stats(self, embeddings: List[Optional[List[float]]]) -> Dict:
        """
        Get statistics about a batch of embeddings.
        
        Args:
            embeddings: List of embeddings
            
        Returns:
            Dict with statistics
        """
        valid_embeddings = [e for e in embeddings if e is not None]
        
        if not valid_embeddings:
            return {
                'total': len(embeddings),
                'valid': 0,
                'failed': len(embeddings),
                'success_rate': 0.0
            }
        
        return {
            'total': len(embeddings),
            'valid': len(valid_embeddings),
            'failed': len(embeddings) - len(valid_embeddings),
            'success_rate': len(valid_embeddings) / len(embeddings),
            'dimensions': len(valid_embeddings[0]) if valid_embeddings else 0
        }


# Singleton instance
_embedding_service: Optional[EmbeddingService] = None


def get_embedding_service() -> EmbeddingService:
    """Get or create singleton EmbeddingService instance"""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
