import { useState } from "react";

export const emojis = [
	"😀","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪",
	"🤨","🧐","🤓","😎","😏","😞","🙁","😫","😤","😡","🤬","😨","😰","😓"
]



export const Emojis = ({ setMessage }) => {
	
	return(
		 
			<div className="emojiSet" style={{ top: '82%', left: '55%' }}>
			{emojis.map((el) => 
				<>					
					<button onClick={() => setMessage((prevMsg) => prevMsg + el)}><span>{el}</span></button>
				</>
			)}		
		
			</div>
	 	
	)
}