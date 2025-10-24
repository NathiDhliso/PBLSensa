"""
Database Configuration

Handles database connection for all environments using AWS RDS.
Credentials are retrieved from environment variables or AWS SSM Parameter Store.
"""

import os
import logging
from typing import Optional
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class DatabaseConfig:
    """Database configuration manager"""
    
    def __init__(self):
        self.host: Optional[str] = None
        self.port: int = 5432
        self.database: Optional[str] = None
        self.username: Optional[str] = None
        self.password: Optional[str] = None
        self.connection_string: Optional[str] = None
        
        self._load_config()
    
    def _load_config(self):
        """Load database configuration from environment or SSM"""
        # Try environment variables first
        self.host = os.getenv('DB_HOST')
        self.port = int(os.getenv('DB_PORT', '5432'))
        self.database = os.getenv('DB_NAME')
        self.username = os.getenv('DB_USER')
        self.password = os.getenv('DB_PASSWORD')
        
        # If not in environment, try SSM Parameter Store
        if not all([self.host, self.database, self.username, self.password]):
            logger.info("Database credentials not in environment, checking AWS SSM...")
            self._load_from_ssm()
        
        # Build connection string if we have all credentials
        if all([self.host, self.database, self.username, self.password]):
            self.connection_string = (
                f"postgresql://{self.username}:{self.password}"
                f"@{self.host}:{self.port}/{self.database}"
            )
            logger.info(f"✅ Database configured: {self.host}:{self.port}/{self.database}")
        else:
            logger.warning("⚠️  Database credentials not found - database features will be unavailable")
    
    def _load_from_ssm(self):
        """Load database credentials from AWS SSM Parameter Store"""
        try:
            ssm = boto3.client('ssm', region_name=os.getenv('AWS_REGION', 'eu-west-1'))
            
            # Parameter names (adjust based on your SSM structure)
            param_prefix = os.getenv('SSM_PARAM_PREFIX', '/pbl/dev')
            
            params_to_fetch = {
                'host': f'{param_prefix}/db/host',
                'port': f'{param_prefix}/db/port',
                'database': f'{param_prefix}/db/name',
                'username': f'{param_prefix}/db/username',
                'password': f'{param_prefix}/db/password',
            }
            
            # Fetch all parameters
            for key, param_name in params_to_fetch.items():
                try:
                    response = ssm.get_parameter(Name=param_name, WithDecryption=True)
                    value = response['Parameter']['Value']
                    
                    if key == 'port':
                        self.port = int(value)
                    else:
                        setattr(self, key, value)
                    
                    logger.debug(f"Loaded {key} from SSM")
                except ClientError as e:
                    if e.response['Error']['Code'] == 'ParameterNotFound':
                        logger.debug(f"Parameter {param_name} not found in SSM")
                    else:
                        logger.error(f"Error fetching {param_name}: {e}")
        
        except Exception as e:
            logger.error(f"Failed to load from SSM: {e}")
    
    def is_configured(self) -> bool:
        """Check if database is properly configured"""
        return self.connection_string is not None


# Singleton instance
_db_config: Optional[DatabaseConfig] = None


def get_database_config() -> DatabaseConfig:
    """Get or create database configuration singleton"""
    global _db_config
    if _db_config is None:
        _db_config = DatabaseConfig()
    return _db_config
