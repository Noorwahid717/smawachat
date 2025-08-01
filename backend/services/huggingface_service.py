import httpx
import os
import base64
import asyncio
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class HuggingFaceService:
    def __init__(self):
        self.api_key = os.getenv('HUGGINGFACE_API_KEY')
        self.llama_model = os.getenv('LLAMA_MODEL', 'meta-llama/Llama-2-7b-chat-hf')
        self.stable_diffusion_model = os.getenv('STABLE_DIFFUSION_MODEL', 'stabilityai/stable-diffusion-xl-base-1.0')
        self.base_url = "https://api-inference.huggingface.co/models"
        
        if not self.api_key:
            raise ValueError("HUGGINGFACE_API_KEY environment variable is required")
    
    async def generate_text(self, prompt: str, max_retries: int = 3) -> str:
        """Generate text using Llama model"""
        url = f"{self.base_url}/{self.llama_model}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Format prompt for Llama chat format
        formatted_prompt = f"<s>[INST] {prompt} [/INST]"
        
        payload = {
            "inputs": formatted_prompt,
            "parameters": {
                "max_new_tokens": 500,
                "temperature": 0.7,
                "do_sample": True,
                "top_p": 0.9,
                "return_full_text": False
            }
        }
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(url, json=payload, headers=headers)
                    
                    if response.status_code == 503:
                        # Model is loading, wait and retry
                        wait_time = 20 * (attempt + 1)
                        logger.info(f"Model loading, waiting {wait_time} seconds...")
                        await asyncio.sleep(wait_time)
                        continue
                    
                    if response.status_code == 200:
                        result = response.json()
                        if isinstance(result, list) and len(result) > 0:
                            generated_text = result[0].get('generated_text', '').strip()
                            return generated_text if generated_text else "Maaf, saya tidak dapat menghasilkan respons saat ini."
                        return "Maaf, saya tidak dapat menghasilkan respons saat ini."
                    
                    logger.error(f"Text generation failed: {response.status_code} - {response.text}")
                    
            except Exception as e:
                logger.error(f"Text generation error (attempt {attempt + 1}): {str(e)}")
                if attempt == max_retries - 1:
                    break
                await asyncio.sleep(5)
        
        return "Maaf, terjadi kesalahan saat menghasilkan respons. Silakan coba lagi."
    
    async def generate_image(self, prompt: str, max_retries: int = 3) -> Optional[str]:
        """Generate image using Stable Diffusion model and return base64 string"""
        url = f"{self.base_url}/{self.stable_diffusion_model}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "guidance_scale": 7.5,
                "num_inference_steps": 20
            }
        }
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(url, json=payload, headers=headers)
                    
                    if response.status_code == 503:
                        # Model is loading, wait and retry
                        wait_time = 30 * (attempt + 1)
                        logger.info(f"Image model loading, waiting {wait_time} seconds...")
                        await asyncio.sleep(wait_time)
                        continue
                    
                    if response.status_code == 200:
                        # Convert binary image data to base64
                        image_bytes = response.content
                        base64_image = base64.b64encode(image_bytes).decode('utf-8')
                        return f"data:image/png;base64,{base64_image}"
                    
                    logger.error(f"Image generation failed: {response.status_code} - {response.text}")
                    
            except Exception as e:
                logger.error(f"Image generation error (attempt {attempt + 1}): {str(e)}")
                if attempt == max_retries - 1:
                    break
                await asyncio.sleep(10)
        
        return None